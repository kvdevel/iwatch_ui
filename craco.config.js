
const CracoLessPlugin = require('craco-less');


module.exports = {
  eslint: { enable: false }, 	
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {			
            modifyVars: { '@body-background' : '#121212' },
            javascriptEnabled: true,
	  },
        },
      },
    },
  ],
};


