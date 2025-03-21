// ProtectedCanvas.jsx
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Canvas from './index' // Importa el Canvas que se exporta desde index.jsx

// Función para extraer el valor de una cookie
const getCookie = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
}

const ProtectedCanvas = () => {
    // Extraemos 'id' del path y lo renombramos a automateId
    const { id: automateId } = useParams()
    console.log('automateId:', automateId) // Verifica el automateId obtenido

    // Obtenemos vendorUid y userUid desde las cookies
    const vendorUid = getCookie('vendorUid')
    const userUid = getCookie('userUid')
    console.log('vendorUid:', vendorUid) // Verifica el vendorUid obtenido
    console.log('userUid:', userUid) // Verifica el userUid obtenido

    // Si no se encuentra userUid, se asigna "0"
    const actualUserUid = userUid ? userUid : '0'

    const [authorized, setAuthorized] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Validamos que tengamos tanto vendorUid como automateId
        if (!vendorUid || !automateId) {
            console.log('Falta vendorUid o automateId') // Falta algún dato de autenticación
            setError('Faltan datos de autenticación.')
            setLoading(false)
            return
        }

        const url = `https://crm.alfabusiness.app/api/${vendorUid}/vendor-settings-automate?automate_id=${automateId}&user_uid=${actualUserUid}`
        console.log('Fetch URL:', url) // Muestra la URL que se va a consumir

        fetch(url)
            .then((response) => {
                console.log('Response:', response) // Revisa la respuesta del fetch
                return response.json()
            })
            .then((data) => {
                console.log('API Data:', data) // Muestra los datos que regresa la API
                // Permitir acceso si es admin o si login_automate es true (en caso de no ser admin)
                if (data.is_admin === true || data.login_automate === true) {
                    setAuthorized(true)
                } else {
                    setAuthorized(false)
                }
                setLoading(false)
            })
            .catch((err) => {
                console.error('Error:', err) // Muestra el error en caso de fallo
                setError(err.message || 'Error al validar la autenticación.')
                setLoading(false)
            })
    }, [vendorUid, automateId, actualUserUid])

    if (loading) return <div>Cargando...</div>
    if (error || !authorized) return <div>Acceso no autorizado</div>

    return <Canvas />
}

export default ProtectedCanvas
