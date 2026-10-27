import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'rejected'],
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: true });

const issueSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters long'],
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Wi-Fi', 'Electrical', 'Plumbing', 'Projector/AV', 'Cleanliness', 'Furniture', 'Other'],
        message: '{VALUE} is not a supported category'
      },
      index: true
    },
    building: {
      type: String,
      required: [true, 'Building or hostel name is required'],
      trim: true,
      maxlength: [100, 'Building name cannot exceed 100 characters'],
      index: true
    },
    room: {
      type: String,
      required: [true, 'Room or specific location is required'],
      trim: true,
      maxlength: [100, 'Room cannot exceed 100 characters']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed', 'rejected'],
      default: 'open',
      index: true
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    imageUrl: {
      type: String,
      default: null
    },
    imagePublicId: {
      type: String,
      default: null
    },
    statusHistory: [statusHistorySchema],
    resolvedAt: {
      type: Date,
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    },
    resolutionNote: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index for duplicate detection & analytics querying
issueSchema.index({ building: 1, room: 1, category: 1, status: 1 });
issueSchema.index({ createdAt: -1 });

const Issue = mongoose.model('Issue', issueSchema);
export default Issue;
