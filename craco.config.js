// these idiots know nothing about tech writing.  So far, this is all I know for sure.
// They gave a big example, and said that mine will be much smaller.
// I just frikin wnaa know what to paste in.

module.exports = {
    babel: {
        loaderOptions: (babelLoaderOptions) => {
            const origBabelPresetCRAIndex = babelLoaderOptions.presets.findIndex((preset) => {
                return preset[0].includes('babel-preset-react-app');
            });

            const origBabelPresetCRA = babelLoaderOptions.presets[origBabelPresetCRAIndex];

            babelLoaderOptions.presets[origBabelPresetCRAIndex] = function overridenPresetCRA(api, opts, env) {
                const babelPresetCRAResult = require(
                    origBabelPresetCRA[0]
                )(api, origBabelPresetCRA[1], env);

                babelPresetCRAResult.presets.forEach(preset => {
                    // detect @babel/preset-react with {development: true, runtime: 'automatic'}
                    const isReactPreset = (
                      preset && preset[1] &&
                      preset[1].runtime === 'automatic' &&
                      preset[1].development === true
                    );
                    if (isReactPreset) {
                        preset[1].importSource = '@welldone-software/why-did-you-render';
                    }
                })

                return babelPresetCRAResult;
            };

            return babelLoaderOptions;
        },
    },
    // if you want to track react-redux selectors
    webpack: {
      alias: {
        'react-redux': process.env.NODE_ENV === 'development' ? 'react-redux/lib' : 'react-redux'
      }
    }
};


