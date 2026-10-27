import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema(
  {
    staffUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true
    },
    usedAt: {
      type: Date,
      default: null
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to quickly find active, unexpired invitation for a token hash
invitationSchema.index({ tokenHash: 1, isUsed: 1, isRevoked: 1 });

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
