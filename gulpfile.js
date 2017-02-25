"use strict";

const gulp = require("gulp");
const tasks = [];

// Jade
const jade = require("gulp-jade");
gulp.task("jade", () => gulp.src("./src/renderer/index.jade").pipe(jade()).pipe(gulp.dest("app/renderer")));
tasks.push("jade");

// Stylus
const stylus = require("gulp-stylus");
gulp.task("stylus-index", () => gulp.src("./src/renderer/index.styl").pipe(stylus({ compress: true })).pipe(gulp.dest("app/renderer")));
tasks.push("stylus-index");

// TypeScript
const ts = require("gulp-typescript");
const tslint = require("gulp-tslint");
const tsProject = ts.createProject("./tsconfig.json");

gulp.task("typescript", () => {
  let failed = false;
  const tsResult = tsProject.src()
    .pipe(tslint())
    .pipe(tslint.report("prose", { emitError: false }))
    .on("error", (err) => { throw err; })
    .pipe(tsProject())
    .on("error", () => { failed = true; })
    .on("end", () => { if (failed) throw new Error("There were TypeScript errors."); });
  return tsResult.js.pipe(gulp.dest("./app"));
});
tasks.push("typescript");

// All
gulp.task("default", tasks);

