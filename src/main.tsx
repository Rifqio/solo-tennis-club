import { LazyMotion, MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n/I18nProvider'
import { installNavMotion } from './lib/nav-motion'

installNavMotion()

const loadMotionFeatures = () => import('./lib/motion-features').then(module => module.default)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Springs and slides follow the phone's reduced-motion setting automatically. */}
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotionFeatures} strict>
        <I18nProvider>
          <App />
        </I18nProvider>
      </LazyMotion>
    </MotionConfig>
  </StrictMode>,
)
