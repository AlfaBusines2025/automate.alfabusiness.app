import { lazy } from 'react'
import Loadable from '@/ui-component/loading/Loadable'
import ProtectedMinimalLayout from './ProtectedMinimalLayout'

const ChatbotFull = Loadable(lazy(() => import('@/views/chatbot')))

const ChatbotRoutes = {
    path: '/',
    element: <ProtectedMinimalLayout />,
    children: [
        {
            path: '/chatbot/:id',
            element: <ChatbotFull />
        }
    ]
}

export default ChatbotRoutes
