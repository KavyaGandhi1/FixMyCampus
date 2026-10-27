import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueApi } from '../api/issueApi';
import { DuplicateWarningModal } from '../components/issues/DuplicateWarningModal';
import {
  PlusCircle,
  AlertCircle,
  Image as ImageIcon,
  MapPin,
  Tag,
  AlertTriangle,
  Upload,
  X,
  CheckCircle2
} from 'lucide-react';

const CATEGORIES = [
  'Wi-Fi',
  'Electrical',
  'Plumbing',
  'Projector/AV',
  'Cleanliness',
  'Furniture',
  'Other'
];

const POPULAR_BUILDINGS = [
  'Academic Block A',
  'Academic Block B',
  'Science Complex',
  'Main Library',
  'Hostel 1 (Boys)',
  'Hostel 2 (Girls)',
  'Hostel 3',
  'Dining Hall & Cafeteria',
  'Sports Arena & Gym',
  'Administration Building'
];

export const CreateIssuePage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Wi-Fi',
    building: '',
    room: '',
    priority: 'medium',
    description: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Duplicate detection state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateList, setDuplicateList] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (PNG, JPG, WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size cannot exceed 5MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Check for duplicates before creation
  const handlePreSubmit = async (e) => {
    e.preventDefault();
    const { title, category, building, room, description } = formData;

    if (!title || !category || !building || !room || !description) {
      setError('Please fill out all required fields.');
      return;
    }

    if (title.length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }

    if (description.length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      // Run duplicate check
      const dupCheck = await issueApi.checkDuplicates({
        building,
        room,
        category
      });

      if (dupCheck.hasDuplicates && dupCheck.duplicates.length > 0) {
        setDuplicateList(dupCheck.duplicates);
        setDuplicateModalOpen(true);
        setSubmitting(false);
        return;
      }

      // No duplicates found, execute creation
      await executeCreate();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit issue.');
      setSubmitting(false);
    }
  };

  const executeCreate = async () => {
    try {
      setSubmitting(true);
      setError('');

      let payload;
      let isMultipart = false;

      if (imageFile) {
        isMultipart = true;
        payload = new FormData();
        payload.append('title', formData.title);
        payload.append('category', formData.category);
        payload.append('building', formData.building);
        payload.append('room', formData.room);
        payload.append('priority', formData.priority);
        payload.append('description', formData.description);
        payload.append('image', imageFile);
      } else {
        payload = formData;
      }

      const res = await issueApi.createIssue(payload, isMultipart);
      if (res.success && res.issue) {
        navigate(`/issues/${res.issue._id}`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create issue.');
    } finally {
      setSubmitting(false);
      setDuplicateModalOpen(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-blue-600" />
          Report a Campus Issue
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit a maintenance ticket. Facilities staff will be dispatched to resolve it.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handlePreSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Issue Title *
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. Projector lamp blown, Wi-Fi outage on 2nd floor, Water leak..."
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category *
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Priority Level *
            </label>
            <div className="relative">
              <AlertTriangle className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low (Cosmetic / non-urgent)</option>
                <option value="medium">Medium (Standard campus defect)</option>
                <option value="high">High (Urgent safety or academic interruption)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Building & Room */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Building or Hostel *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="building"
                required
                list="building-suggestions"
                placeholder="e.g. Academic Block A, Hostel 3"
                value={formData.building}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              <datalist id="building-suggestions">
                {POPULAR_BUILDINGS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Room or Exact Location *
            </label>
            <input
              type="text"
              name="room"
              required
              placeholder="e.g. Room 302, Washroom, 2nd floor corridor"
              value={formData.room}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Detailed Description *
          </label>
          <textarea
            name="description"
            rows={4}
            required
            placeholder="Please provide specific details: when it started, specific symptoms, and any safety hazards..."
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Issue Photo (Optional)
          </label>
          {imagePreview ? (
            <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="h-44 w-auto object-cover max-w-full"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-slate-900/70 hover:bg-slate-900 text-white p-1 rounded-full shadow"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700">
                Click to attach photo or drag and drop
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPG or WebP up to 5MB
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            {submitting ? 'Verifying & Submitting...' : 'Submit Maintenance Ticket'}
          </button>
        </div>
      </form>

      {/* Duplicate warning modal */}
      <DuplicateWarningModal
        isOpen={duplicateModalOpen}
        duplicates={duplicateList}
        onConfirmSubmit={executeCreate}
        onClose={() => setDuplicateModalOpen(false)}
      />
    </div>
  );
};
