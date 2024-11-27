/** @type {import('next').NextConfig} */
interface WebpackConfig {
  externals: string[];
}

interface ApiConfig {
  bodyParser: {
    sizeLimit: string;
  };
}

interface NextConfig {
  webpack: (config: WebpackConfig) => WebpackConfig;
  api: ApiConfig;
}

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals = [...config.externals, "fs"];
    return config;
  },
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;
 