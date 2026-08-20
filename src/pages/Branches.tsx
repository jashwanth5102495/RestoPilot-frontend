import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, MessageCircle, MapPin, Building2, GitBranch } from 'lucide-react'

export default function Branches() {
  const [branches, setBranches] = useState<any[]>([])
  
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get('/restaurants/branches')
        setBranches(res.data.data || [])
      } catch (error) {
        console.error('Failed to fetch branches:', error)
      }
    }
    fetchBranches()
  }, [])
  
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const restaurantName = user?.restaurant?.name || 'my restaurant'
  
  const handleRequestWhatsApp = () => {
    const text = `Hi, I would like to add a new branch for my restaurant ${restaurantName}. Please help me set it up.`
    const url = `https://wa.me/918328246413?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Branches</h1>
        <p className="text-gray-500">Manage your restaurant branches and locations.</p>
      </div>
      
      {branches.length > 1 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map(branch => (
            <Card key={branch._id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">{branch.name}</CardTitle>
                  {!branch.parentRestaurantId ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Main Branch
                    </span>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      branch.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {branch.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mt-2">
                  <div className="flex items-start text-sm text-gray-500">
                    <Building2 className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                    <span>{branch.city || 'N/A'}</span>
                  </div>
                  <div className="flex items-start text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{branch.address || 'No address provided'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Card className="border-dashed border-2 bg-gray-50/50">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Add New Branch</h2>
          <p className="text-gray-500 max-w-md mb-6">
            Adding a new branch requires assistance from our team. Send us a request on WhatsApp and we'll set it up for you.
          </p>
          <Button 
            onClick={handleRequestWhatsApp}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Request on WhatsApp
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
