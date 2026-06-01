import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import css from 'rollup-plugin-css-only';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let started = false;
	return {
		writeBundle() {
			if (!started) {
				started = true;
				spawn('npm', ['run', 'start', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true,
				});
			}
		},
	};
}

export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/build/bundle.js',
		inlineDynamicImports: true,
	},
	plugins: [
		replace({
			preventAssignment: true,
			values: {
				'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
				'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY || ''),
				'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN || ''),
				'process.env.FIREBASE_DATABASE_URL': JSON.stringify(process.env.FIREBASE_DATABASE_URL || ''),
				'process.env.FIREBASE_PROJECT_ID': JSON.stringify(process.env.FIREBASE_PROJECT_ID || ''),
				'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.FIREBASE_STORAGE_BUCKET || ''),
				'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.FIREBASE_MESSAGING_SENDER_ID || ''),
				'process.env.FIREBASE_APP_ID': JSON.stringify(process.env.FIREBASE_APP_ID || ''),
			},
		}),
		svelte({
			compilerOptions: {
				dev: !production,
			},
			emitCss: true,
		}),
		css({ output: 'bundle.css' }),
		resolve({
			browser: true,
			dedupe: ['svelte'],
			exportConditions: ['svelte'],
		}),
		commonjs(),
		!production && serve(),
		!production && livereload('public'),
		production && terser(),
	],
	watch: {
		clearScreen: false,
	},
};
