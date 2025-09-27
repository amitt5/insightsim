"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Respondent {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  status: 'in_progress' | 'completed';
  simulation_id: string;
  created_at: string;
  updated_at: string;
  simulation: {
    id: string;
    topic: string;
  };
  message_count: number;
  last_message_at: string | null;
}

interface RespondentsResponse {
  respondents: Respondent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function RespondentsPage() {
  const [respondents, setRespondents] = useState<Respondent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // TODO: Add filter state later
  // const [searchTerm, setSearchTerm] = useState("");
  // const [statusFilter, setStatusFilter] = useState<string>("");
  // const [simulationFilter, setSimulationFilter] = useState<string>("");

  const fetchRespondents = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
        // TODO: Add filters later
        // ...(searchTerm && { search: searchTerm }),
        // ...(statusFilter && { status: statusFilter }),
        // ...(simulationFilter && { simulation_id: simulationFilter })
      });

      const response = await fetch(`/api/respondents?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch respondents: ${response.status} - ${errorText}`);
      }

      const data: RespondentsResponse = await response.json();
      setRespondents(data.respondents);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (err) {
      console.error('Error fetching respondents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load respondents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRespondents();
  }, []); // TODO: Add filter dependencies later

  const handlePageChange = (page: number) => {
    fetchRespondents(page);
  };

  const handleStatusChange = async (respondentId: string, newStatus: 'in_progress' | 'completed') => {
    try {
      const response = await fetch(`/api/respondents/${respondentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh the data
      fetchRespondents(currentPage);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update respondent status');
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Human Interviews</h1>
          <p className="text-gray-600">Manage your Interviews</p>
        </div>
      </div>

      {/* TODO: Add filters later */}
      {/* <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={simulationFilter || "all"} onValueChange={(value) => setSimulationFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by simulation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Simulations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card> */}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-sm text-gray-600">Total Respondents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {respondents.filter(r => r.status === 'in_progress').length}
            </div>
            <p className="text-sm text-gray-600">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {respondents.filter(r => r.status === 'completed').length}
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Respondents Table */}
      {/* <Card>
        
        <CardContent> */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
          ) : respondents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No respondents found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Respondent</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Started/Last Active</th>
                      <th className="text-left py-3 px-4 font-medium">Simulation</th>
                      <th className="text-right py-3 px-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {respondents.map((respondent) => (
                      <tr key={respondent.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">
                            {respondent.name} {respondent.age}{respondent.gender.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-600">{respondent.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(respondent.status)}>
                            {respondent.status === 'in_progress' ? 'In Progress' : 'Completed'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(respondent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          <br />
                          {respondent.last_message_at
                            ? new Date(respondent.last_message_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'No activity'
                          }
                        </td>
                        <td className="py-3 px-4">
                          <Link 
                            href={`/simulations/${respondent.simulation_id}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            <div className="max-w-[200px] truncate">
                              {respondent.simulation.topic}
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(
                                  respondent.id,
                                  respondent.status === 'in_progress' ? 'completed' : 'in_progress'
                                )}
                              >
                                {respondent.status === 'in_progress' ? 'Complete' : 'Restart'}
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/idi/${respondent.simulation_id}/${respondent.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, total)} of {total} respondents
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="px-3 py-2 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        {/* </CardContent>
      </Card> */}
    </div>
  );
}
