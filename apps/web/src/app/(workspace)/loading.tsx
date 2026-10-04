import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkspaceLoading() {
  return (
    <div className="space-y-7" aria-label="Loading workspace" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
