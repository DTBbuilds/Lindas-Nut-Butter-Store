# Deploying Linda's Nut Butter Store to Vercel with MongoDB Atlas

This guide walks through deploying your application with:
- **Database**: MongoDB Atlas (already set up)
- **Frontend & Backend**: Vercel

## Prerequisites

1. [Vercel account](https://vercel.com/signup)
2. [GitHub account](https://github.com/signup) (for source code hosting)
3. [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register) (already configured)

## Step 1: Prepare Your Repository

1. Create a GitHub repository for your project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Vercel deployment"
   git remote add origin https://github.com/your-username/lindas-nut-butter-store.git
   git push -u origin main
   ```

## Step 2: Install Vercel CLI

1. Install the Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

## Step 3: Deploy to Vercel

You can deploy in two ways:

### Option 1: Using Vercel CLI (Recommended for first deployment)

1. From your project directory, run:
   ```bash
   vercel
   ```

2. Follow the prompts:
   - Set up and deploy? `Y`
   - Which scope? `<Select your account>`
   - Link to existing project? `N`
   - Project name: `lindas-nut-butter-store`
   - Directory? `./` (root directory)
   - Want to override settings? `N`

3. Wait for deployment to complete.

### Option 2: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: `Create React App`
   - Root Directory: `./` (root directory)
   - Build Command: `npm run vercel-build`
   - Output Directory: `build`
   - Install Command: `npm install`

5. Add Environment Variables:
   - `MONGO_URI`: `mongodb+srv://dtbbuilds:dtbbuilds2025@cluster0.qnwgmty.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority&appName=Cluster0`
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `PRODUCTION_BASE_URL`: `https://lindas-nut-butter.vercel.app/api`
   - `PRODUCTION_FRONTEND_URL`: `https://lindas-nut-butter.vercel.app`

6. Click "Deploy"

## Step 4: Update M-Pesa Callback URLs

After deployment, update your M-Pesa callback URLs in the `.env.production` file:

```
CALLBACK_URL=https://lindas-nut-butter.vercel.app/api/mpesa/callback
VALIDATION_URL=https://lindas-nut-butter.vercel.app/api/mpesa/validation
CONFIRMATION_URL=https://lindas-nut-butter.vercel.app/api/mpesa/confirmation
```

Then redeploy:
```bash
vercel --prod
```

## Step 5: Set Up Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Click "Domains"
3. Add your custom domain (e.g., `lindas-nut-butter.com`)
4. Follow instructions to configure DNS settings

## Step 6: Verify Deployment

1. Visit your deployed frontend: `https://lindas-nut-butter.vercel.app`
2. Test the API endpoints: `https://lindas-nut-butter.vercel.app/api/products`
3. Verify MongoDB Atlas connection through the application

## Troubleshooting

### Deployment Errors

If you encounter deployment errors:
1. Check Vercel build logs in the deployment dashboard
2. Verify all environment variables are set correctly
3. Ensure your MongoDB Atlas network access allows connections from Vercel (IP: 0.0.0.0/0)

### API Connection Issues

If frontend can't connect to backend:
1. Check CORS settings in your Express server
2. Verify API routes in Vercel configuration
3. Check network request URLs in browser console

## Monitoring and Maintenance

- **Vercel Analytics**: Monitor performance and usage in Vercel dashboard
- **MongoDB Atlas**: Monitor database performance in Atlas dashboard
- **Logs**: View application logs in Vercel dashboard under "Deployments" > "Functions"

## Updating Your Application

To update your deployed application:
1. Make changes to your code
2. Commit changes to GitHub
3. If you've connected GitHub to Vercel, it will auto-deploy
4. Or manually deploy: `vercel --prod`
