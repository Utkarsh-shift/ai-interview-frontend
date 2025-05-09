// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   // ✅ Set body size limit for server actions and API routes (App Router)
//   serverActions: {
//     bodySizeLimit: '10mb' // increase this if needed
//   },

//   experimental: {
//   appDir: true,
// }

//   async headers() {
//     return [
//       {
//         source: "/api/:path*",
//         headers: [
//           {
//             key: "Access-Control-Allow-Origin",
//             value: "*",
//           },
//           {
//             key: "Access-Control-Allow-Methods",
//             value: "GET,POST,OPTIONS",
//           },
//           {
//             key: "Access-Control-Allow-Headers",
//             value: "Content-Type",
//           },
//         ],
//       },
//     ];
//   },
// };

// module.exports = nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size for server actions and API routes
  serverActions: {
    bodySizeLimit: '10mb'
  },

  experimental: {
    appDir: true
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,OPTIONS"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
