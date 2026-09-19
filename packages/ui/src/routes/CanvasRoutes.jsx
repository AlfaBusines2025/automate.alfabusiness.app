import { lazy } from 'react'
import Loadable from '@/ui-component/loading/Loadable'
import ProtectedMinimalLayout from './ProtectedMinimalLayout'

// canvas routing
const ProtectedCanvas = Loadable(lazy(() => import('@/views/canvas/ProtectedCanvas')))
const Canvas = Loadable(lazy(() => import('@/views/canvas')))
const MarketplaceCanvas = Loadable(lazy(() => import('@/views/marketplaces/MarketplaceCanvas')))

const CanvasRoutes = {
    path: '/',
    element: <ProtectedMinimalLayout />,
    children: [
        {
            path: '/canvas',
            element: <Canvas />
        },
        {
            path: '/canvas/:id',
            element: <Canvas />
        },
        {
            path: '/agentcanvas',
            element: <Canvas />
        },
        {
            path: '/agentcanvas/:id',
            element: <Canvas />
        },
        {
            path: '/marketplace/:id',
            element: <MarketplaceCanvas />
        }
    ]
}

export default CanvasRoutes
