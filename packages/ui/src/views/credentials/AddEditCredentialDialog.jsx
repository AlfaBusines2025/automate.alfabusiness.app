import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import parser from 'html-react-parser'

// Material
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Box, Stack, OutlinedInput, Typography } from '@mui/material'

// Project imports
import { StyledButton } from '@/ui-component/button/StyledButton'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import CredentialInputHandler from './CredentialInputHandler'

// Icons
import { IconX } from '@tabler/icons-react'

// API
import credentialsApi from '@/api/credentials'

// Hooks
import useApi from '@/hooks/useApi'

// utils
import useNotifier from '@/utils/useNotifier'
import { initializeDefaultNodeData } from '@/utils/genericHelper'

// const
import { baseURL, REDACTED_CREDENTIAL_VALUE } from '@/store/constant'
import { HIDE_CANVAS_DIALOG, SHOW_CANVAS_DIALOG } from '@/store/actions'

// Helper para leer la cookie "userUid"
function getCookie(name) {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
        return parts.pop().split(';').shift()
    }
    return ''
}

const AddEditCredentialDialog = ({ show, dialogProps, onCancel, onConfirm, setError }) => {
    const portalElement = document.getElementById('portal')
    const dispatch = useDispatch()

    // ==============================|| Snackbar ||============================== //
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const getSpecificCredentialApi = useApi(credentialsApi.getSpecificCredential)
    const getSpecificComponentCredentialApi = useApi(credentialsApi.getSpecificComponentCredential)

    const [credential, setCredential] = useState({})
    const [name, setName] = useState('')
    const [credentialData, setCredentialData] = useState({})
    const [componentCredential, setComponentCredential] = useState({})

    // Se leen los flags de admin desde Redux.
    // Según la lógica: isAdmin === true → superadmin; isAdmin === false && loginAutomate === true → admin.
    const { isAdmin, loginAutomate } = useSelector((state) => state.admin)
    console.log('cgl: AddEditCredentialDialog - isAdmin:', isAdmin, 'loginAutomate:', loginAutomate)

    useEffect(() => {
        if (getSpecificCredentialApi.data) {
            setCredential(getSpecificCredentialApi.data)
            if (getSpecificCredentialApi.data.name) {
                setName(getSpecificCredentialApi.data.name)
            }
            if (getSpecificCredentialApi.data.plainDataObj) {
                setCredentialData(getSpecificCredentialApi.data.plainDataObj)
            }
            getSpecificComponentCredentialApi.request(getSpecificCredentialApi.data.credentialName)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSpecificCredentialApi.data])

    useEffect(() => {
        if (getSpecificComponentCredentialApi.data) {
            setComponentCredential(getSpecificComponentCredentialApi.data)
        }
    }, [getSpecificComponentCredentialApi.data])

    useEffect(() => {
        if (getSpecificCredentialApi.error && setError) {
            setError(getSpecificCredentialApi.error)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSpecificCredentialApi.error])

    useEffect(() => {
        if (getSpecificComponentCredentialApi.error && setError) {
            setError(getSpecificComponentCredentialApi.error)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSpecificComponentCredentialApi.error])

    useEffect(() => {
        if (dialogProps.type === 'EDIT' && dialogProps.data) {
            console.log('cgl: EDIT from dashboard, requesting credential id:', dialogProps.data.id)
            getSpecificCredentialApi.request(dialogProps.data.id)
        } else if (dialogProps.type === 'EDIT' && dialogProps.credentialId) {
            console.log('cgl: EDIT from canvas, requesting credential id:', dialogProps.credentialId)
            getSpecificCredentialApi.request(dialogProps.credentialId)
        } else if (dialogProps.type === 'ADD' && dialogProps.credentialComponent) {
            console.log('cgl: ADD new credential; resetting fields')
            setName('')
            setCredential({})
            const defaultCredentialData = initializeDefaultNodeData(dialogProps.credentialComponent.inputs)
            setCredentialData(defaultCredentialData)
            setComponentCredential(dialogProps.credentialComponent)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dialogProps])

    useEffect(() => {
        if (show) dispatch({ type: SHOW_CANVAS_DIALOG })
        else dispatch({ type: HIDE_CANVAS_DIALOG })
        return () => dispatch({ type: HIDE_CANVAS_DIALOG })
    }, [show, dispatch])

    const addNewCredential = async () => {
        try {
            // Objeto que se enviará para crear la credencial
            const obj = {
                name,
                credentialName: componentCredential.name,
                plainDataObj: credentialData
            }
            console.log('cgl: addNewCredential - initial obj:', obj)

            // Si el usuario NO es superadmin (es decir, isAdmin es false y loginAutomate es true),
            // se asocia el valor de la cookie "userUid".
            if (!isAdmin && loginAutomate) {
                const userUidValue = getCookie('userUid')
                console.log('cgl: addNewCredential - userUidValue from cookie:', userUidValue)
                if (userUidValue) {
                    obj.userUid = userUidValue
                    console.log('cgl: addNewCredential - obj actualizado con userUid:', obj)
                } else {
                    console.log('cgl: addNewCredential - NO se encontró userUid en cookie')
                }
            } else {
                console.log('cgl: addNewCredential - usuario es superadmin, no asigna userUid')
            }

            const createResp = await credentialsApi.createCredential(obj)
            console.log('cgl: addNewCredential - respuesta del API:', createResp)
            if (createResp.data) {
                enqueueSnackbar({
                    message: 'New Credential added',
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
                onConfirm(createResp.data.id)
            }
        } catch (error) {
            console.error('cgl: addNewCredential - error:', error)
            if (setError) setError(error)
            enqueueSnackbar({
                message: `Failed to add new Credential: ${
                    typeof error.response?.data === 'object' ? error.response.data.message : error.response?.data
                }`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: true,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
            onCancel()
        }
    }

    const saveCredential = async () => {
        try {
            const saveObj = {
                name,
                credentialName: componentCredential.name
            }

            let plainDataObj = {}
            for (const key in credentialData) {
                if (credentialData[key] !== REDACTED_CREDENTIAL_VALUE) {
                    plainDataObj[key] = credentialData[key]
                }
            }
            if (Object.keys(plainDataObj).length) saveObj.plainDataObj = plainDataObj

            const saveResp = await credentialsApi.updateCredential(credential.id, saveObj)
            if (saveResp.data) {
                enqueueSnackbar({
                    message: 'Credential saved',
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
                onConfirm(saveResp.data.id)
            }
        } catch (error) {
            console.error('cgl: saveCredential - error:', error)
            if (setError) setError(error)
            enqueueSnackbar({
                message: `Failed to save Credential: ${
                    typeof error.response?.data === 'object' ? error.response.data.message : error.response?.data
                }`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: true,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
            onCancel()
        }
    }

    const component = show ? (
        <Dialog
            fullWidth
            maxWidth='sm'
            open={show}
            onClose={onCancel}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
        >
            <DialogTitle sx={{ fontSize: '1rem' }} id='alert-dialog-title'>
                {componentCredential && componentCredential.label && (
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <div
                            style={{
                                width: 50,
                                height: 50,
                                marginRight: 10,
                                borderRadius: '50%',
                                backgroundColor: 'white'
                            }}
                        >
                            <img
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    padding: 7,
                                    borderRadius: '50%',
                                    objectFit: 'contain'
                                }}
                                alt={componentCredential.name}
                                src={`${baseURL}/api/v1/components-credentials-icon/${componentCredential.name}`}
                            />
                        </div>
                        {componentCredential.label}
                    </div>
                )}
            </DialogTitle>
            <DialogContent>
                {componentCredential && componentCredential.description && (
                    <Box sx={{ pl: 2, pr: 2 }}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                borderRadius: 10,
                                background: 'rgb(254,252,191)',
                                padding: 10,
                                marginTop: 10,
                                marginBottom: 10
                            }}
                        >
                            <span style={{ color: 'rgb(116,66,16)' }}>{parser(componentCredential.description)}</span>
                        </div>
                    </Box>
                )}
                {componentCredential && componentCredential.label && (
                    <Box sx={{ p: 2 }}>
                        <Stack sx={{ position: 'relative' }} direction='row'>
                            <Typography variant='overline'>
                                Credential Name
                                <span style={{ color: 'red' }}>&nbsp;*</span>
                            </Typography>
                        </Stack>
                        <OutlinedInput
                            id='credName'
                            type='string'
                            fullWidth
                            placeholder={componentCredential.label}
                            value={name}
                            name='name'
                            onChange={(e) => setName(e.target.value)}
                        />
                    </Box>
                )}
                {componentCredential?.inputs?.map((inputParam, index) => (
                    <CredentialInputHandler key={index} inputParam={inputParam} data={credentialData} />
                ))}
            </DialogContent>
            <DialogActions>
                <StyledButton
                    disabled={!name}
                    variant='contained'
                    onClick={() => (dialogProps.type === 'ADD' ? addNewCredential() : saveCredential())}
                >
                    {dialogProps.confirmButtonName}
                </StyledButton>
            </DialogActions>
            <ConfirmDialog />
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

AddEditCredentialDialog.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func,
    setError: PropTypes.func
}

export default AddEditCredentialDialog
