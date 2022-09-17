import '../styles/globals.css'
import { appWithTranslation } from 'next-i18next'
import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'
import { ThemeProvider } from '@mui/material/styles'
import { CacheProvider } from '@emotion/react'
import createEmotionCache from '../src/createEmotionCache'
import theme from '../src/theme'
import MainLayout from '@/components/Layout/MainLayout'

import mixpanel from 'mixpanel-browser'
import { useEffect } from 'react'
import { MixpanelTracking } from '@/utils/mixpanel'
import { RecoilRoot, useRecoilState } from 'recoil'
import { useRouter } from 'next/router'
import Script from 'next/script'

import * as gtag from '@/lib/gtag'
import { AppContextType } from 'next/dist/shared/lib/utils'
import { userAgentState } from '@/src/state/UserAgent'

const clientSideEmotionCache = createEmotionCache();

function MyApp({ Component, pageProps }: AppProps) {

  const router = useRouter()
  useEffect(() => {
    MixpanelTracking.getInstance().pageViewed(router.pathname)
  }, [])

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gtag.pageview(url)
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    router.events.on('hashChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
      router.events.off('hashChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <CacheProvider value={clientSideEmotionCache}>
      <ChakraProvider>
        <ThemeProvider theme={theme}>
          <RecoilRoot>
            <MainLayout>
              {/* Global Site Tag (gtag.js) - Google Analytics */}
              <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
              />
              <Script
                id="gtag-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${gtag.GA_TRACKING_ID}', {
                      page_path: window.location.pathname,
                    });
                  `,
                }}
              />
              <Component {...pageProps} />
            </MainLayout>
          </RecoilRoot>
        </ThemeProvider>
      </ChakraProvider>
    </CacheProvider>
  )
}


export default appWithTranslation(MyApp)
