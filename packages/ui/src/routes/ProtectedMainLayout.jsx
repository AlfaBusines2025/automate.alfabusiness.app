import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import MainLayout from '@/layout/MainLayout'
import { useDispatch } from 'react-redux'

const getCookie = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
}

const ProtectedMainLayout = () => {
    const location = useLocation()
    const dispatch = useDispatch()
    const queryParams = new URLSearchParams(location.search)
    // automate_id ahora es opcional
    const automateId = queryParams.get('automate_id')
    console.log('cgl: automateId:', automateId)

    const vendorUid = getCookie('vendorUid')
    const userUid = getCookie('userUid') || '0'
    console.log('cgl: vendorUid:', vendorUid)
    console.log('cgl: userUid:', userUid)

    const [authorized, setAuthorized] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        console.log('cgl: Iniciando ProtectedMainLayout useEffect')
        if (!vendorUid) {
            console.log('cgl: Falta vendorUid')
            setError('Faltan datos de autenticación.')
            setLoading(false)
            return
        }

        // Construimos la URL sin forzar automate_id si no existe
        let url = `https://crm.alfabusiness.app/api/${vendorUid}/vendor-settings-automate?user_uid=${userUid}`
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
                // Para las rutas generales se permite solo si is_admin es true
                if (data.is_admin === true) {
                    // DESPACHAMOS A REDUX
                    dispatch({
                        type: 'SET_ADMIN_STATE',
                        payload: {
                            is_admin: true,
                            login_automate: data.login_automate
                        }
                    })
                    console.log('cgl: Autorizado (is_admin true)')
                    setAuthorized(true)
                } else {
                    console.log('cgl: No autorizado (is_admin no es true)')
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
    if (error || !authorized) {
        // window.location.href = 'https://crm.alfabusiness.app/vendor-console'
        return <div>Sin Acceso...</div>
    }

    return (
        <MainLayout>
            <Outlet />
        </MainLayout>
    )
}

export default ProtectedMainLayout
