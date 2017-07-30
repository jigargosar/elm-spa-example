import * as _ from "ramda"
import fs from "fs"
import {run} from 'runjs'
import {runFish} from "../common"
import {Module, Modules} from "./module"

const computeDependencies = function () {
  const srcGlob = "src/**.elm"
  
  const output = runFish(`find ${srcGlob}`, {stdio: 'pipe'})
  
  const isBlank = _.compose(_.isEmpty, _.trim)
  const fileNames = _.compose(_.reject(isBlank), _.split("\n"))(output)
  
  
  const moduleList = _.compose(
      _.map(Module),
      // _.take(2),
      // _.drop(20),
  )(fileNames)
  
  return Modules(moduleList)
}

export function logTransitiveImportsOf(fileName) {
  const moduleName = Module(fileName).moduleName
  const module = computeDependencies()[moduleName]
  const transitiveBackwardImports =
      module ? _.pick([
            "transitiveBackwardImports",
            "transitiveBackwardImportsCount",
            "transitiveImports",
            "transitiveImportsCount",
          ],
      )(module) : []
  console.log(JSON.stringify({transitiveBackwardImports}, null, 2))
  return transitiveBackwardImports
}

export function generateDependenciesStatsFile() {
  const modules = computeDependencies()
  
  run("mkdir -p stats")
  fs.writeFileSync(
      "stats/elm-src-dependencies.json",
      JSON.stringify(modules, null, 2),
      "UTF-8",
  )
  // console.log("dep", modules["Document"])
}

const addCompileTime = _.curry((mainModuleName, module)=>{
  run("touch "+ module.fileName)
  const startTime = Date.now()
  run(`elm-make ${mainModuleName} --output /dev/null`)
  const elapsed = Date.now() - startTime
  let onTouchMainFileCompileTime = elapsed / 1000
  console.log(onTouchMainFileCompileTime)
  return _.merge(module, {onTouchMainFileCompileTime})
})

export function generateElmMakeStatsFile() {
  const modules = computeDependencies()
  
  const modulesWithCompileTime = _.map(addCompileTime("src/Main.elm"))(modules)
  
  run("mkdir -p stats")
  let statsFileName = "stats/elm-make-compile-time.json"
  console.log("writing stats:",statsFileName)
  fs.writeFileSync(
      statsFileName,
      JSON.stringify(modulesWithCompileTime, null, 2),
      "UTF-8",
  )
  // console.log("dep", modules["Document"])
}



