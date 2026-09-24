import config from "@repo/eslint-config";

export default [...config, { ignores: ["src/routeTree.gen.ts", "src/components/ui/**"] }];
