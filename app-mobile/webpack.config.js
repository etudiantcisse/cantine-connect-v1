const createExpoWebpackConfigAsync = require("@expo/webpack-config");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  if (!config.resolve.extensions.includes(".mjs")) {
    config.resolve.extensions.push(".mjs");
  }

  // Ensure .mjs files in node_modules are resolved correctly.
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: "javascript/auto",
  });

  return config;
};
