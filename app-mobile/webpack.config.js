const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

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

  // Copy public assets and manifest to dist
  if (!config.plugins) {
    config.plugins = [];
  }

  config.plugins.push(
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "public"),
          to: path.resolve(__dirname, "dist"),
          globOptions: {
            ignore: ["**/index.html"],
          },
        },
      ],
    }),
  );

  return config;
};
