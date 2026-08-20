import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Users, Plus, Trash2, Key } from 'lucide-react'

export default function AdminAgents() {
  const { toast } = useToast()
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchAgents = async () => {
    try {
      const res = await api.get('/admin/agents')
      setAgents(res.data.data || [])
    } catch (error) {
      console.error("Error fetching agents", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !code) return

    setSubmitting(true)
    try {
      await api.post('/admin/agents', { name, code })
      toast({
        title: "Agent Created",
        description: `Agent code ${code.toUpperCase()} has been registered successfully.`,
      })
      setName('')
      setCode('')
      fetchAgents()
    } catch (error: any) {
      toast({
        title: "Failed to create agent",
        description: error.response?.data?.message || "Verify the details and try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAgent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this agent? This code will no longer work.")) return

    try {
      await api.delete(`/admin/agents/${id}`)
      toast({
        title: "Agent Deleted",
        description: "The agent code has been revoked."
      })
      fetchAgents()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to delete agent.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Manage Agents</h2>
        <p className="text-gray-500">Create, view, and revoke agent setup codes for branch setups.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Agent Form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5 text-orange-500" /> Create New Agent</CardTitle>
            <CardDescription>Generate an authorized agent code for branch setup.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateAgent}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name</Label>
                <Input 
                  id="agentName" 
                  placeholder="e.g. Rahul Kumar" 
                  value={name}
                  onChange={(e: any) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentCode">Setup Code</Label>
                <Input 
                  id="agentCode" 
                  placeholder="e.g. AGENT_RAHUL" 
                  value={code}
                  onChange={(e: any) => setCode(e.target.value)}
                  required
                  className="uppercase"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2">
                <Plus className="w-4 h-4" /> {submitting ? 'Creating...' : 'Create Agent'}
              </Button>
            </CardContent>
          </form>
        </Card>

        {/* Agents List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active Setup Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 py-4">Loading data...</p>
            ) : agents.length === 0 ? (
              <p className="text-gray-500 py-4">No agent codes registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Agent Name</th>
                      <th className="px-4 py-3 font-semibold text-center">Setup Code</th>
                      <th className="px-4 py-3 font-semibold text-center">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr key={agent._id} className="border-b last:border-0 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{agent.name}</div>
                          <div className="text-xs text-gray-500">Created: {new Date(agent.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                          {agent.code}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700`}>
                            {agent.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAgent(agent._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
