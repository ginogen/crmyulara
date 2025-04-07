import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Alert,
  SelectChangeEvent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuth } from '@/contexts/AuthContext'

type Role = 'super_admin' | 'org_admin' | 'branch_manager' | 'sales_agent'

interface UserFormData {
  email: string
  password: string
  fullName: string
  role: Role
  organizationId: string
  branchId: string
}

interface Organization {
  id: string
  name: string
  description: string
  status: string
}

interface Branch {
  id: string
  name: string
  organization_id: string
  status: string
}

interface User {
  id: string
  email: string
  full_name: string
  role: Role
  organization_id: string
  branch_id: string
}

export default function UserManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    fullName: '',
    role: 'sales_agent',
    organizationId: '',
    branchId: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()
  const { userRole } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .eq('status', 'active')

      if (orgsError) throw orgsError
      setOrganizations(orgsData)

      // Fetch branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .eq('status', 'active')

      if (branchesError) throw branchesError
      setBranches(branchesData)

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')

      if (usersError) throw usersError
      setUsers(usersData)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          }
        }
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        // 2. Create public user
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: formData.email,
              full_name: formData.fullName,
              role: formData.role,
              organization_id: formData.organizationId,
              branch_id: formData.branchId
            }
          ])

        if (insertError) throw insertError

        setSuccess('Usuario creado exitosamente')
        setFormData({
          email: '',
          password: '',
          fullName: '',
          role: 'sales_agent',
          organizationId: '',
          branchId: ''
        })
        setOpenDialog(false)
        fetchData()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getBranchName = (branchId: string) => {
    return branches.find(b => b.id === branchId)?.name || '-'
  }

  const getOrganizationName = (orgId: string) => {
    return organizations.find(o => o.id === orgId)?.name || '-'
  }

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'super_admin':
        return 'error'
      case 'org_admin':
        return 'warning'
      case 'branch_manager':
        return 'info'
      case 'sales_agent':
        return 'success'
      default:
        return 'default'
    }
  }

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin'
      case 'org_admin':
        return 'Admin Organización'
      case 'branch_manager':
        return 'Gerente Sucursal'
      case 'sales_agent':
        return 'Agente de Ventas'
      default:
        return role
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Crear Usuario
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Organización</TableCell>
              <TableCell>Sucursal</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={getRoleLabel(user.role)}
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{getOrganizationName(user.organization_id)}</TableCell>
                <TableCell>{getBranchName(user.branch_id)}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar">
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Nombre Completo"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              margin="normal"
              required
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Rol</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleSelectChange}
                label="Rol"
                required
              >
                {userRole === 'super_admin' && (
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                )}
                <MenuItem value="org_admin">Admin de Organización</MenuItem>
                <MenuItem value="branch_manager">Gerente de Sucursal</MenuItem>
                <MenuItem value="sales_agent">Agente de Ventas</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Organización</InputLabel>
              <Select
                name="organizationId"
                value={formData.organizationId}
                onChange={handleSelectChange}
                label="Organización"
                required
              >
                {organizations.map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Sucursal</InputLabel>
              <Select
                name="branchId"
                value={formData.branchId}
                onChange={handleSelectChange}
                label="Sucursal"
                required
                disabled={!formData.organizationId}
              >
                {branches
                  .filter((branch) => branch.organization_id === formData.organizationId)
                  .map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              Crear Usuario
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
} 