import {checkAccess} from '@/lib/auth-check';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';

export default async function Home() {
  await checkAccess('admin', '/');
  return (
    <div className="flex flex-col gap-4 py-4 px-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Root</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Tabs defaultValue="stuff" className=""></Tabs>
    </div>
  );
}
