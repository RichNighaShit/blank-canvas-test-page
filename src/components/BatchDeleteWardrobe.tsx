import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ClothingItem {
  id: string;
  name: string;
  photo_url: string;
  category: string;
  color: string[];
  style: string;
  occasion: string[];
  season: string[];
  tags: string[];
  created_at?: string;
  updated_at?: string;
}

interface BatchDeleteWardrobeProps {
  items: ClothingItem[];
  onDelete: (ids: string[]) => void;
}

export const BatchDeleteWardrobe = ({
  items,
  onDelete,
}: BatchDeleteWardrobeProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleDelete = async () => {
    if (selectedItems.length === 0) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("wardrobe_items")
        .delete()
        .in("id", selectedItems);

      if (error) throw error;

      onDelete(selectedItems);
      setSelectedItems([]);
      setIsOpen(false);

      toast({
        title: "Items Deleted",
        description: `${selectedItems.length} items have been removed from your wardrobe.`,
      });
    } catch (error) {
      console.error("Error deleting items:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Batch Delete
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delete Multiple Items</DialogTitle>
          <DialogDescription>
            Select the items you want to remove from your wardrobe. This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={
                selectedItems.length === items.length && items.length > 0
              }
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All ({items.length} items)
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="aspect-square relative overflow-hidden rounded-lg border">
                  <img
                    src={item.photo_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) =>
                        handleSelectItem(item.id, checked as boolean)
                      }
                      className="bg-white shadow-md"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.category}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedItems.length > 0 && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">
                {selectedItems.length} item
                {selectedItems.length !== 1 ? "s" : ""} selected for deletion
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={selectedItems.length === 0 || isDeleting}
              className="flex-1"
            >
              {isDeleting
                ? "Deleting..."
                : `Delete ${selectedItems.length} Item${selectedItems.length !== 1 ? "s" : ""}`}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedItems([]);
                setIsOpen(false);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
