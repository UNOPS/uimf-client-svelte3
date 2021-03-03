/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-console */

/*
Available commands:
1. `gulp watch`
2. `gulp watch --minify`
3. `gulp build`
*/

// Compilation process:
// 1. build svelte components and copy them to "./build" (the build is done with typescript compilation)
// 2. compile compile-app-ts and move it to "wwwroot/js/app.js"
// 3. compile all ["scr/**/*.scss", "src/**/*.css"] files and move them to "wwwroot/css/main.css"
// 4. move all files from "./wwwroot" to "wwwroot".

const gulp = require('gulp');
const rollup = require('rollup');
const del = require('del');
const terser = require('rollup-plugin-terser').terser;
const { argv } = require('yargs');
const inject = require('gulp-inject');
const svelte = require('rollup-plugin-svelte');
const sveltePreprocessor = require('svelte-preprocess');
const postcss = require('rollup-plugin-postcss');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const builtins = require('rollup-plugin-node-builtins');
const globals = require('rollup-plugin-node-globals');
const json = require('@rollup/plugin-json');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const hash = require('gulp-hash-filename');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');

const distDir = 'wwwroot';

const minify = !!argv.minify;
const prod = !!argv.prod;

process.on('unhandledRejection', (r) => console.log(r)); // eslint-disable-line no-console

gulp.task('cleanJs', () =>
  prod
    ? del([`${distDir}/javascript/*`], {
        force: true,
      })
    : del([`${distDir}/javascript/*`, `!${distDir}/javascript/bundle.js`], {
        force: true,
      })
);

gulp.task('cleanCss', () =>
  prod
    ? del([`${distDir}/css/*`], {
        force: true,
      })
    : del([`${distDir}/css/*`, `!${distDir}/css/bundle.css`], {
        force: true,
      })
);

gulp.task(
  'compile-app-ts',
  gulp.series('cleanJs', async function compileTypsceipt() {
    const plugins = [
      svelte({
        dev: !prod,
        extensions: ['.svelte'],
        preprocess: sveltePreprocessor(),
        emitCss: true,
        onwarn: function (warning) {
          return;
        },
      }),
      postcss({
        extract: true,
      }),
      resolve({
        jsnext: true,
        main: true,
        browser: true,
        preferBuiltins: true,
      }),
      commonjs({ include: 'node_modules/**', extensions: ['.js', '.ts'] }),
      typescript({
        tsconfig: 'tsconfig.json',
      }),
      globals(),
      builtins(),
      json(),
    ];

    if (minify) {
      plugins.push(terser());
    }

    if (prod) {
      plugins.push(terser({ sourcemap: true }));
    }

    const bundle = await rollup.rollup({
      input: 'src/App.ts',
      plugins,
      onwarn: function (warning) {
        return;
      },
    });

    bundle.warn;

    return bundle.write({
      sourcemap: true,
      format: 'iife',
      dir: 'wwwroot/javascript',
      entryFileNames: prod ? 'bundle.[hash].js' : 'bundle.js',
    });
  })
);

gulp.task(
  'sass',
  gulp.series('cleanCss', () =>
    gulp
      .src(['src/**/*.scss', 'src/**/*.css'])
      .pipe(sass().on('error', sass.logError))
      .pipe(concat('main.css'))
      .pipe(
        hash({
          format: prod ? '{name}.{hash}.{size}{ext}' : 'bundle.css',
        })
      )
      .pipe(cleanCSS({ compatibility: '*' }))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(`${distDir}/css/`))
  )
);

gulp.task(
  'inject-js',
  gulp.series('compile-app-ts', function injectJs() {
    const target = gulp.src([`${distDir}/index.html`]);
    // It's not necessary to read the files (will speed up things), we're only after their paths:

    const sources = prod
      ? gulp.src([`./${distDir}/javascript/*.js`], {
          read: false,
        })
      : gulp.src([`./${distDir}/javascript/bundle.js`], {
          read: false,
        });

    return target
      .pipe(
        inject(sources, {
          addRootSlash: false,
          ignorePath: 'wwwroot/',
        })
      )
      .pipe(gulp.dest(`${distDir}`));
  })
);

gulp.task(
  'inject-css',
  gulp.series('sass', () => {
    const target = gulp.src(`${distDir}/index.html`);
    // It's not necessary to read the files (will speed up things), we're only after their paths:

    const sources = prod
      ? gulp.src([`./${distDir}/css/*.css`], {
          read: false,
        })
      : gulp.src([`./${distDir}/css/bundle.css`], {
          read: false,
        });

    return target
      .pipe(inject(sources, { addRootSlash: false, ignorePath: 'wwwroot/' }))
      .pipe(gulp.dest(`${distDir}`));
  })
);

gulp.task(
  'watch',
  gulp.series(gulp.parallel('inject-js', 'inject-css'), () => {
    gulp.watch(['src/**/*.scss', 'src/**/*.css'], gulp.parallel('sass'));
    gulp.watch(
      ['src/**/*.svelte', 'src/**/*.js', 'src/**/*.ts', 'gulpfile.js'],
      gulp.parallel('compile-app-ts')
    );
  })
);

gulp.task('build', gulp.parallel('inject-js', 'inject-css'));
