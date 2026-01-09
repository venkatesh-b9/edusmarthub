import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { toast } from 'sonner';

interface FilterPopoverProps {
  trigger?: React.ReactNode;
}

export function FilterPopover({ trigger }: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({
    region: '',
    status: '',
    schoolType: '',
    showActive: true,
    showInactive: false,
    showPending: false,
  });

  const handleApply = () => {
    toast.success('Filters applied', {
      description: 'Dashboard data has been filtered',
    });
    setOpen(false);
  };

  const handleClear = () => {
    setFilters({
      region: '',
      status: '',
      schoolType: '',
      showActive: true,
      showInactive: false,
      showPending: false,
    });
    toast.info('Filters cleared');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Filter Dashboard</h4>
            <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 px-2 text-xs">
              Clear all
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={filters.region} onValueChange={(v) => setFilters({ ...filters, region: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="north">North Region</SelectItem>
                  <SelectItem value="south">South Region</SelectItem>
                  <SelectItem value="east">East Region</SelectItem>
                  <SelectItem value="west">West Region</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>School Type</Label>
              <Select value={filters.schoolType} onValueChange={(v) => setFilters({ ...filters, schoolType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="elementary">Elementary</SelectItem>
                  <SelectItem value="middle">Middle School</SelectItem>
                  <SelectItem value="high">High School</SelectItem>
                  <SelectItem value="k12">K-12</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={filters.showActive}
                    onCheckedChange={(checked) => setFilters({ ...filters, showActive: !!checked })}
                  />
                  <label htmlFor="active" className="text-sm">Active Schools</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inactive"
                    checked={filters.showInactive}
                    onCheckedChange={(checked) => setFilters({ ...filters, showInactive: !!checked })}
                  />
                  <label htmlFor="inactive" className="text-sm">Inactive Schools</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pending"
                    checked={filters.showPending}
                    onCheckedChange={(checked) => setFilters({ ...filters, showPending: !!checked })}
                  />
                  <label htmlFor="pending" className="text-sm">Pending Verification</label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
