// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss'
  ], 
  nitro: {
    routeRules: {
      '/**': { 
        headers: {
          'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        }
      }
    }
  },
  css: ['~/assets/css/main.css'],
  app: { 
    head: {
      title: 'CodePort | Modern Deployment Platform',
      meta: [
        { name: 'description', content: 'Streamline your deployment workflow with CodePort - the modern, secure deployment management platform' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  }
})