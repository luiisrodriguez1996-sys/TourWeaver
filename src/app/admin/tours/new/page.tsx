"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Globe, ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function NewTour() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      router.push('/admin/tours/1'); // In real app, push the created ID
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Tours
      </Link>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
             <Globe className="text-primary w-6 h-6" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">Create New Tour</CardTitle>
          <CardDescription>Setup the base details for your virtual experience.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tour Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Sunnyvale Modern Villa" 
                required 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Unique URL Slug</Label>
              <div className="flex items-center gap-2">
                 <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">tourweaver.com/tour/</span>
                 <Input 
                  id="slug" 
                  placeholder="my-cool-tour" 
                  required 
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Provide a brief overview of the space..." 
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Initial Scene Upload (360° Image)</Label>
              <div className="border-2 border-dashed border-primary/20 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:bg-primary/5 transition-colors cursor-pointer group">
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="text-primary w-6 h-6" />
                 </div>
                 <div className="text-center">
                    <p className="font-medium">Click or drag to upload panoramic image</p>
                    <p className="text-xs text-muted-foreground mt-1">Recommended: 6000x3000 JPG, 2:1 aspect ratio</p>
                 </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-primary hover:bg-primary/90 text-lg py-6" disabled={isLoading}>
              {isLoading ? 'Creating Experience...' : 'Initialize Tour & Start Weaving'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}