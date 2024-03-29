/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ["user-images.githubusercontent.com", "i.imgur.com"],
    unoptimized: true,
  },
  output: "export", //
  webpack: (config, ctx) => {
    config.experiments.asyncWebAssembly = true;

    // https://github.com/vercel/next.js/issues/25852#issuecomment-861285936

    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    config.module.rules.unshift({
      test: /\.worker\.ts$/,
      use: { loader: "worker-loader" },
    });

    if (ctx.isServer) {
      config.output.webassemblyModuleFilename =
        "./../static/wasm/[modulehash].wasm";
    } else {
      config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";
    }

    return config;
  },
};

module.exports = nextConfig;
