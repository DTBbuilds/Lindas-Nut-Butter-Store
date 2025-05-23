# MongoDB Atlas Setup Guide for Linda's Nut Butter Store

This guide will walk you through setting up a MongoDB Atlas cluster for your production database.

## 1. Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for an account if you don't have one.
2. Once logged in, click on "Create" to start a new project.
3. Name your project (e.g., "Linda's Nut Butter Store") and click "Next".
4. You can add team members if needed, or skip this step.
5. Click "Create Project".

## 2. Create a Cluster

1. Click "Build a Database" to create a new cluster.
2. Choose the "FREE" tier for M0 Shared Cluster (sufficient for starting out).
3. Select a cloud provider (AWS, Google Cloud, or Azure) and a region closest to Kenya (e.g., AWS in South Africa or Europe).
4. Name your cluster (e.g., "lindas-nut-butter-prod").
5. Click "Create Cluster". This may take a few minutes to provision.

## 3. Set Up Database Access

1. While the cluster is being created, click on "Database Access" in the left sidebar.
2. Click "Add New Database User".
3. Create a username and a strong password.
4. Set the appropriate permissions:
   - For simplicity, you can choose "Atlas admin" role.
   - For better security, choose "Read and write to any database".
5. Click "Add User".

## 4. Configure Network Access

1. Click on "Network Access" in the left sidebar.
2. Click "Add IP Address".
3. For development, you can add your current IP address.
4. For production, you have two options:
   - Add your production server's IP address (more secure)
   - Allow access from anywhere by adding `0.0.0.0/0` (less secure but easier)
5. Click "Confirm".

## 5. Get Your Connection String

1. Once your cluster is created, click "Connect" on your cluster.
2. Choose "Connect your application".
3. Select "Node.js" as your driver and the appropriate version.
4. Copy the connection string provided.
5. Replace `<password>` with your database user's password.
6. Replace `<dbname>` with "lindas-nut-butter".

## 6. Update Your Environment Variables

Update your `.env.production` file with the MongoDB Atlas connection string:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority
```

## 7. Test the Connection

Before deploying to production, test your MongoDB Atlas connection:

```bash
node -e "
const mongoose = require('mongoose');
mongoose.connect('your_connection_string_here', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Atlas connection successful!'))
.catch(err => console.error('MongoDB Atlas connection error:', err));
"
```

## 8. Set Up Database Backups

1. In MongoDB Atlas, go to your cluster and click on "Backup".
2. For the free tier, you'll have basic backup options.
3. For paid tiers, you can configure automated backups with custom schedules.

## 9. Data Migration (If Needed)

To migrate data from your local MongoDB to Atlas:

1. Export your local data:
   ```bash
   mongodump --uri="mongodb://localhost:27017/lindas-nut-butter" --out=./backup
   ```

2. Import to MongoDB Atlas:
   ```bash
   mongorestore --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/lindas-nut-butter" ./backup/lindas-nut-butter
   ```

## 10. Best Practices for Production

1. **Never share your MongoDB Atlas credentials**
2. **Regularly update your database user passwords**
3. **Set up IP whitelisting for production servers only**
4. **Enable database auditing for tracking changes (available in paid tiers)**
5. **Regularly back up your data**
6. **Monitor your database performance using Atlas metrics**

By following these steps, you'll have a secure, scalable MongoDB database in the cloud that's ready for your production application.
