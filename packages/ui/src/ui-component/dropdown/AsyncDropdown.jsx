import { useState, useEffect, Fragment } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import axios from 'axios'

// Material
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete'
import { Popper, CircularProgress, TextField, Box, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'

// API
import credentialsApi from '@/api/credentials'

// const
import { baseURL } from '@/store/constant'

const StyledPopper = styled(Popper)({
    boxShadow: '0px 8px 10px -5px rgb(0 0 0 / 20%), 0px 16px 24px 2px rgb(0 0 0 / 14%), 0px 6px 30px 5px rgb(0 0 0 / 12%)',
    borderRadius: '10px',
    [`& .${autocompleteClasses.listbox}`]: {
        boxSizing: 'border-box',
        '& ul': {
            padding: 10,
            margin: 10
        }
    }
})

// Esta función ya existía: llama al node-load-method
const fetchList = async ({ name, nodeData }) => {
    const loadMethod = nodeData.inputParams.find((param) => param.name === name)?.loadMethod
    const username = localStorage.getItem('username')
    const password = localStorage.getItem('password')

    let lists = await axios
        .post(
            `${baseURL}/api/v1/node-load-method/${nodeData.name}`,
            { ...nodeData, loadMethod },
            {
                auth: username && password ? { username, password } : undefined,
                headers: { 'Content-type': 'application/json', 'x-request-from': 'internal' }
            }
        )
        .then((response) => response.data)
        .catch((error) => {
            console.error(error)
            return []
        })

    return lists || []
}

// NUEVO: si es admin, usa la existente getCredentialsByName
const fetchCredentialListAdmin = async (credentialNames) => {
    try {
        let names = ''
        if (credentialNames.length > 1) {
            names = credentialNames.join('&credentialName=')
        } else {
            names = credentialNames[0]
        }
        const resp = await credentialsApi.getCredentialsByName(names) // dev: /credentials?credentialName=...
        if (resp?.data) {
            const returnList = []
            for (let i = 0; i < resp.data.length; i++) {
                returnList.push({
                    label: resp.data[i].name,
                    name: resp.data[i].id
                })
            }
            return returnList
        }
    } catch (error) {
        console.error(error)
    }
    return []
}

// NUEVO: si NO es admin, llama a getCredentialsByNameForUser
const fetchCredentialListForUser = async (credentialNames, userUid) => {
    try {
        let names = ''
        if (credentialNames.length > 1) {
            names = credentialNames.join('&credentialName=')
        } else {
            names = credentialNames[0]
        }
        // llama a tu nuevo endpoint
        const resp = await credentialsApi.getCredentialsByNameForUser(names, userUid)
        //  (ej: GET /credentials/user?credentialName=names&userUid=???)
        if (resp?.data) {
            const returnList = []
            for (let i = 0; i < resp.data.length; i++) {
                returnList.push({
                    label: resp.data[i].name,
                    name: resp.data[i].id
                })
            }
            return returnList
        }
    } catch (error) {
        console.error(error)
    }
    return []
}

export const AsyncDropdown = ({
    name,
    nodeData,
    value,
    onSelect,
    isCreateNewOption,
    onCreateNew,
    credentialNames = [],
    disabled = false,
    freeSolo = false,
    disableClearable = false
}) => {
    // ----------------------------------------------------------------
    // 1. Leemos customization (modo oscuro) y si esAdmin
    // ----------------------------------------------------------------
    const customization = useSelector((state) => state.customization)
    const { isAdmin } = useSelector((state) => state.admin)

    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState([])
    const [loading, setLoading] = useState(false)

    const findMatchingOptions = (list = [], val) => list.find((opt) => opt.name === val)
    const getDefaultOptionValue = () => ''
    const addNewOption = [{ label: '- Create New -', name: '-create-' }]

    let [internalValue, setInternalValue] = useState(value ?? 'choose an option')

    // ----------------------------------------------------------------
    // 3. useEffect principal, recarga si isAdmin cambia
    // ----------------------------------------------------------------
    useEffect(() => {
        setLoading(true)
        ;(async () => {
            let response = []

            // A) Si el nodo usa credenciales
            if (credentialNames.length > 0) {
                if (isAdmin) {
                    // Admin => obtener TODAS las credenciales
                    response = await fetchCredentialListAdmin(credentialNames)
                } else {
                    // No admin => obtener SOLO credenciales de user
                    const userUid = localStorage.getItem('userUid') // o cookie
                    response = await fetchCredentialListForUser(credentialNames, userUid)
                }
            }
            // B) Si NO hay credenciales => node-load-method normal
            else {
                response = await fetchList({ name, nodeData })
            }

            // "Create New" al final si corresponde
            if (isCreateNewOption) {
                setOptions([...response, ...addNewOption])
            } else {
                setOptions([...response])
            }

            setLoading(false)
        })()
    }, [isAdmin, credentialNames, nodeData, name, isCreateNewOption])

    // ----------------------------------------------------------------
    // 4. Render
    // ----------------------------------------------------------------
    return (
        <>
            <Autocomplete
                id={name}
                freeSolo={freeSolo}
                disabled={disabled}
                disableClearable={disableClearable}
                size='small'
                sx={{ mt: 1, width: '100%' }}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                options={options}
                value={findMatchingOptions(options, internalValue) || getDefaultOptionValue()}
                onChange={(e, selection) => {
                    const val = selection ? selection.name : ''
                    if (isCreateNewOption && val === '-create-') {
                        onCreateNew()
                    } else {
                        setInternalValue(val)
                        onSelect(val)
                    }
                }}
                PopperComponent={StyledPopper}
                loading={loading}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        value={internalValue}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <Fragment>
                                    {loading ? <CircularProgress color='inherit' size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </Fragment>
                            )
                        }}
                        sx={{ height: '100%', '& .MuiInputBase-root': { height: '100%' } }}
                    />
                )}
                renderOption={(props, option) => (
                    <Box component='li' {...props}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant='h5'>{option.label}</Typography>
                            {option.description && (
                                <Typography sx={{ color: customization.isDarkMode ? '#9e9e9e' : '' }}>{option.description}</Typography>
                            )}
                        </div>
                    </Box>
                )}
            />
        </>
    )
}

AsyncDropdown.propTypes = {
    name: PropTypes.string,
    nodeData: PropTypes.object,
    value: PropTypes.string,
    onSelect: PropTypes.func,
    onCreateNew: PropTypes.func,
    disabled: PropTypes.bool,
    freeSolo: PropTypes.bool,
    credentialNames: PropTypes.array,
    disableClearable: PropTypes.bool,
    isCreateNewOption: PropTypes.bool
}
