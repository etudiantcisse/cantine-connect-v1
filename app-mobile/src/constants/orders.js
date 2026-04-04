export const ORDER_STATUS = {
  EN_ATTENTE: "en_attente",
  EN_PREPARATION: "en_preparation",
  PRETE: "prete",
  LIVREE: "livree",
  ANNULEE: "annulee",
};

export const ORDER_STATUS_LABEL = {
  [ORDER_STATUS.EN_ATTENTE]: "En attente",
  [ORDER_STATUS.EN_PREPARATION]: "En preparation",
  [ORDER_STATUS.PRETE]: "Prete",
  [ORDER_STATUS.LIVREE]: "Livree",
  [ORDER_STATUS.ANNULEE]: "Annulee",
};

export const PAYMENT_MODES = ["cash", "wave", "orange_money"];
