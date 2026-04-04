import React, { createContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,nom,prenom,telephone,role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    setProfile(data);
    return data;
  };

  const normalizeRole = (rawRole) =>
    rawRole === "vendeur" ? "vendeur" : "etudiant";

  const ensureVendorRecord = async (user, resolvedProfile) => {
    const profileRole = normalizeRole(
      resolvedProfile?.role ?? user?.user_metadata?.role,
    );
    if (!user?.id || profileRole !== "vendeur") {
      return;
    }

    const { data: existingVendor, error: vendorReadError } = await supabase
      .from("vendors")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (vendorReadError) {
      throw vendorReadError;
    }

    if (existingVendor?.id) {
      return;
    }

    const metadata = user.user_metadata ?? {};
    const nomCantine =
      (metadata.nomCantine ?? metadata.nom_cantine ?? "").toString().trim() ||
      `Cantine ${resolvedProfile?.prenom ?? "Vendeur"}`;
    const localisation =
      (metadata.localisation ?? "").toString().trim() || "Campus";
    const telephone =
      (resolvedProfile?.telephone ?? metadata.telephone ?? "")
        .toString()
        .trim() || null;

    const { error: vendorInsertError } = await supabase.from("vendors").insert({
      profile_id: user.id,
      nom_cantine: nomCantine,
      localisation,
      telephone,
    });

    if (vendorInsertError) {
      throw vendorInsertError;
    }
  };

  const ensureProfile = async (user) => {
    if (!user?.id) {
      return null;
    }

    const existing = await fetchProfile(user.id);
    if (existing) {
      await ensureVendorRecord(user, existing);
      return existing;
    }

    const metadata = user.user_metadata ?? {};
    const payload = {
      id: user.id,
      email: user.email ?? "",
      nom: (metadata.nom ?? "Utilisateur").toString().trim() || "Utilisateur",
      prenom: (metadata.prenom ?? "Nouveau").toString().trim() || "Nouveau",
      telephone: metadata.telephone
        ? metadata.telephone.toString().trim()
        : null,
      role: normalizeRole(metadata.role),
    };

    const { error: insertError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (insertError) {
      throw insertError;
    }
    const resolved = await fetchProfile(user.id);
    await ensureVendorRecord(user, resolved);
    return resolved;
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session);
      if (data.session?.user?.id) {
        try {
          await ensureProfile(data.session.user);
          setAuthError(null);
        } catch (error) {
          setProfile(null);
          setAuthError(error.message ?? "Profil introuvable");
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user?.id) {
        try {
          await ensureProfile(nextSession.user);
          setAuthError(null);
        } catch (error) {
          setProfile(null);
          setAuthError(error.message ?? "Profil introuvable");
        }
      } else {
        setProfile(null);
        setAuthError(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message ?? "Erreur de connexion");
      throw error;
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (user?.id) {
      try {
        await ensureProfile(user);
      } catch (profileError) {
        setAuthError(profileError.message ?? "Profil introuvable");
      }
    }
  };

  const signUp = async ({
    email,
    password,
    nom,
    prenom,
    telephone,
    role,
    nomCantine,
    localisation,
  }) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nom,
          prenom,
          telephone,
          role,
          nomCantine,
          localisation,
        },
      },
    });

    if (error) {
      setAuthError(error.message ?? "Erreur d'inscription");
      throw error;
    }

    const user = data.user;
    if (!user) {
      throw new Error("Utilisateur non cree");
    }

    if (data.session?.user?.id) {
      await ensureProfile(data.session.user);
      return { emailConfirmationRequired: false };
    }

    setAuthError("Compte cree. Verifiez votre email puis connectez-vous.");
    return { emailConfirmationRequired: true };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message ?? "Erreur de deconnexion");
      throw error;
    }
    setAuthError(null);
    setProfile(null);
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      authError,
      isAuthenticated: Boolean(session?.user),
      signIn,
      signUp,
      signOut,
    }),
    [session, profile, loading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
