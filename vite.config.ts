import { defineConfig, UserConfig } from 'vite'
import tsConfig from './tsconfig.json' assert { type: 'json' }
import path from 'path'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

const tsPaths = tsConfig.compilerOptions.paths;

type Alias = keyof typeof tsPaths;

const alias = {} as Record<Alias, string>;
for (const key in tsPaths)
    alias[key as Alias] = path.resolve(tsPaths[key as Alias][0]);

const cfg: UserConfig = {
    base: '/passports/',
    build: {outDir: 'build'},
    resolve: {alias},
    plugins: [ViteImageOptimizer({
        test: /\.svg/i,
        exclude: /sprite\.svg/
    })]
};

export default defineConfig(({ command }) => {
    const isDev = command === 'serve';
    if (isDev) alias['@passports'] = path.resolve('src', 'get-passports', 'dev-static.ts');
    return cfg;
});