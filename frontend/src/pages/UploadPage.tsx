import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Textarea,
} from '@/components/ui';
import FileUpload from '@/components/FileUpload';
import { useCreateMeeting, useUploadMeetingFile } from '@/hooks';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const createMeeting = useCreateMeeting();
  const uploadFile = useUploadMeetingFile();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!formData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setFormData((prev) => ({ ...prev, title: fileName }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!selectedFile) newErrors.file = 'Please select a file to upload';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const meeting = await createMeeting.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
      });

      if (selectedFile) {
        await uploadFile.mutateAsync({
          file: selectedFile,
        });

        navigate(`/meetings/${meeting.id}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const isLoading = createMeeting.isPending || uploadFile.isPending;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Upload Meeting</h1>
          <p className="text-muted-foreground">
            Upload your meeting recording to generate summaries and action items
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
              <CardDescription>
                Provide information about your meeting recording
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Recording File
                  <span className="ml-1 text-destructive">*</span>
                </label>
                <FileUpload onFileSelect={handleFileSelect} />
                {errors.file && (
                  <p className="mt-2 text-sm text-destructive" role="alert">
                    {errors.file}
                  </p>
                )}
              </div>

              {/* Title */}
              <Input
                id="title"
                name="title"
                label="Meeting Title"
                placeholder="e.g., Sprint Planning - Q1 2024"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                required
              />

              {/* Description */}
              <Textarea
                id="description"
                name="description"
                label="Description (Optional)"
                placeholder="Add any additional context about this meeting..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                  Upload & Process
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default UploadPage;
