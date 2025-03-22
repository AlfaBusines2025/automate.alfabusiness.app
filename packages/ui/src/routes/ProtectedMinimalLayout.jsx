import { useState, useEffect } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import MinimalLayout from '@/layout/MinimalLayout'

const getCookie = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
}

const ProtectedMinimalLayout = () => {
    // 1. Obtenemos tanto el path param (useParams) como el query param (useLocation)
    const { id: routeId } = useParams()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)

    // 2. Decide cómo llamarlo
    // - Si viene "id" en la ruta /canvas/:id, lo asignamos a automateId
    // - Si no, revisamos si existe ?automate_id= en el query string
    const automateId = routeId || queryParams.get('automate_id')
    console.log('cgl: automateId:', automateId)

    const vendorUid = getCookie('vendorUid')
    const userUid = getCookie('userUid') || '0'
    console.log('cgl: vendorUid:', vendorUid)
    console.log('cgl: userUid:', userUid)

    const [authorized, setAuthorized] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        console.log('cgl: Iniciando ProtectedMinimalLayout useEffect')
        if (!vendorUid) {
            console.log('cgl: Falta vendorUid')
            setError('Faltan datos de autenticación.')
            setLoading(false)
            return
        }

        // 3. Construimos la URL base
        let url = `https://crm.alfabusiness.app/api/${vendorUid}/vendor-settings-automate?user_uid=${userUid}`

        // Si viene automateId (por path param o query param), lo agregamos:
        if (automateId) {
            url += `&automate_id=${automateId}`
        }

        console.log('cgl: URL de autenticación:', url)

        fetch(url)
            .then((response) => {
                console.log('cgl: Respuesta fetch:', response)
                return response.json()
            })
            .then((data) => {
                console.log('cgl: Datos recibidos:', data)
                // Para Canvas/Chatbot se permite si is_admin === true o login_automate === true
                if (data.is_admin === true || data.login_automate === true) {
                    setAuthorized(true)
                } else {
                    setAuthorized(false)
                }
                setLoading(false)
            })
            .catch((err) => {
                console.error('cgl: Error en fetch:', err)
                setError(err.message || 'Error al validar la autenticación.')
                setLoading(false)
            })
    }, [vendorUid, automateId, userUid])

    console.log('cgl: Estado final - loading:', loading, 'error:', error, 'authorized:', authorized)

    if (loading) return <div>Cargando...</div>

    // Redirigir en lugar de mostrar mensaje
    if (error || !authorized) {
        // window.location.href = 'https://crm.alfabusiness.app/vendor-console'
        return <div>Sin Acceso...</div>
    }

    return (
        <MinimalLayout>
            <Outlet />
        </MinimalLayout>
    )
}

export default ProtectedMinimalLayout
