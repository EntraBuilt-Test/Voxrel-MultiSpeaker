import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from './src/models/review.model.js';
import Task from './src/models/task.model.js';
// Load env vars
dotenv.config();
const checkFeedback = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI not found');
            return;
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        // Find reviews with feedback
        const reviewsWithFeedback = await Review.find({
            feedback: { $exists: true, $ne: '' },
        }).populate('taskId');
        console.log(`Found ${reviewsWithFeedback.length} reviews with feedback:`);
        for (const review of reviewsWithFeedback) {
            console.log('--- Review ---');
            console.log(`ID: ${review._id}`);
            console.log(`TaskID: ${review.taskId}`);
            // @ts-expect-error - taskId may be populated with Task document
            console.log(`Task Title: ${review.taskId?.title || 'Unknown'}`);
            console.log(`Status: ${review.status}`);
            console.log(`Feedback: ${review.feedback}`);
        }
        const completedTasks = await Task.find({ status: 'COMPLETED' });
        console.log(`\nTotal completed tasks: ${completedTasks.length}`);
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await mongoose.disconnect();
    }
};
checkFeedback();
//# sourceMappingURL=check_feedback.js.map