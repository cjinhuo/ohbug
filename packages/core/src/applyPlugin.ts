import { Config, Enhancer } from '@ohbug/types'

function applyPlugin(...plugins: any[]): (config: Config) => Enhancer {
  return (config: Config) =>
    plugins.reduce<Enhancer>(
      (previous, plugin) => {
        const { capturer, collector } = plugin({ config })
        return {
          capturers: [...previous.capturers, capturer],
          collectors: [...previous.collectors, collector]
        }
      },
      {
        capturers: [],
        collectors: []
      }
    )
}

export default applyPlugin
