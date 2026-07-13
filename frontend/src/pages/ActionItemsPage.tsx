import React, { useState } from 'react';
import { Trash2, Check } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  LoadingSpinner,
} from '@/components/ui';
import EmptyState from '@/components/EmptyState';
import { useActionItems, useDeleteActionItem, useCompleteActionItem } from '@/hooks';
import { formatDate, getPriorityColor, getPriorityLabel } from '@/utils';
import { ActionItem, MeetingPriority } from '@/types';

const ActionItemsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const { data, isLoading } = useActionItems({ 
    status: filter === 'all' ? undefined : filter,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const deleteActionItem = useDeleteActionItem();
  const completeActionItem = useCompleteActionItem();

  const handleComplete = (id: string) => {
    completeActionItem.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this action item?')) {
      deleteActionItem.mutate(id);
    }
  };

  const getStatusBadgeVariant = (status: ActionItem['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Action Items</h1>
          <p className="text-muted-foreground">Manage tasks extracted from your meetings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Action Items ({data?.total || 0})</CardTitle>
            <CardDescription>Track and manage your meeting action items</CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.data || data.data.length === 0 ? (
              <EmptyState
                title="No action items found"
                description="Action items will appear here as they're extracted from meeting recordings"
              />
            ) : (
              <div className="space-y-4">
                {data.data.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleComplete(item.id)}
                      disabled={item.status === 'completed'}
                      className="mt-1 flex h-5 w-5 items-center justify-center rounded border-2 border-primary disabled:opacity-50"
                      aria-label={item.status === 'completed' ? 'Completed' : 'Mark as complete'}
                    >
                      {item.status === 'completed' && (
                        <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3
                            className={`font-semibold ${
                              item.status === 'completed' ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant={getStatusBadgeVariant(item.status)}>
                              {item.status.replace('_', ' ')}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={getPriorityColor(item.priority as MeetingPriority)}
                            >
                              {getPriorityLabel(item.priority as MeetingPriority)}
                            </Badge>
                            {item.assignee && (
                              <Badge variant="outline">Assigned: {item.assignee}</Badge>
                            )}
                            {item.dueDate && (
                              <Badge variant="outline">Due: {formatDate(item.dueDate, 'PP')}</Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            aria-label="Delete action item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActionItemsPage;
