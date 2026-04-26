import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// Comprehensive mock file system
const MOCK_FILE_SYSTEM: Record<string, any> = {
  '/var/www/staycation/backend/sysadmin/core/debug/logs/explorer': [
    { name: '../', isDir: true },
    { name: 'archive/', isDir: true, date: '2025-12-01 10:00' },
    { name: 'backups/', isDir: true, date: '2026-04-20 02:00' },
    { name: 'config/', isDir: true, date: '2026-04-01 10:10' },
    { name: 'database/', isDir: true, date: '2026-04-01 10:10' },
    { name: 'scripts/', isDir: true, date: '2026-04-01 12:00' },
    { name: 'src/', isDir: true, date: '2026-04-25 20:10' },
    { name: 'storage/', isDir: true, date: '2026-04-25 10:10' },
    { name: 'vendors/', isDir: true, date: '2026-04-05 08:30' },
    { name: '.env', isDir: false, size: '1.2K', date: '2026-03-12 08:44' },
    { name: '_package.json', isDir: false, size: '2.3K', date: '2026-04-15 16:41' },
    { name: '_next.config.ts', isDir: false, size: '1.1K', date: '2026-04-10 10:15' },
    { name: '_docker-compose.yml', isDir: false, size: '2.4K', date: '2026-03-01 09:00' },
    { name: 'log_2026_04_00.bak', isDir: false, size: '52K', date: '2026-04-01 04:22' },
    { name: 'log_2026_04_01.bak', isDir: false, size: '69K', date: '2026-04-08 04:22' },
    { name: 'log_2026_04_02.bak', isDir: false, size: '86K', date: '2026-04-15 04:22' }
  ],
  '/var/www/staycation/backend/sysadmin/core/debug/logs/explorer/archive': [
    { name: '../', isDir: true },
    { name: '2024/', isDir: true, date: '2025-01-01 00:00' },
    { name: '2025/', isDir: true, date: '2026-01-01 00:00' },
    { name: 'old_config.ini', isDir: false, size: '4.5K', date: '2024-06-15 14:20' }
  ],
  '/var/www/staycation/backend/sysadmin/core/debug/logs/explorer/backups': [
    { name: '../', isDir: true },
    { name: 'db_dump_v1.sql.gz', isDir: false, size: '450M', date: '2026-04-19 23:59' },
    { name: 'db_dump_v2.sql.gz', isDir: false, size: '455M', date: '2026-04-20 23:59' },
    { name: 'fs_snapshot_full.tar.gz', isDir: false, size: '1.2G', date: '2026-04-01 01:00' }
  ],
  '/var/www/staycation/backend/sysadmin/core/debug/logs/explorer/src': [
    { name: '../', isDir: true },
    { name: 'controllers/', isDir: true, date: '2026-04-25 10:10' },
    { name: 'models/', isDir: true, date: '2026-04-25 10:15' },
    { name: 'views/', isDir: true, date: '2026-04-25 10:20' },
    { name: 'index.php', isDir: false, size: '800B', date: '2026-04-25 20:10' }
  ],
   '/var/www/staycation/backend/sysadmin/core/debug/logs/explorer/scripts': [
    { name: '../', isDir: true },
    { name: 'deploy.sh', isDir: false, size: '1.5K', date: '2026-04-01 11:30' },
    { name: 'cleanup.py', isDir: false, size: '2.1K', date: '2026-03-28 09:15' },
    { name: 'migrate_db.php', isDir: false, size: '3.4K', date: '2026-04-01 12:00' }
  ],
  '/var/www/staycation/backend/sysadmin/core/debug/logs/explorer/config': [
    { name: '../', isDir: true },
    { name: 'database.php', isDir: false, size: '2.1K', date: '2026-04-01 10:10' },
    { name: 'mail.php', isDir: false, size: '1.5K', date: '2026-04-01 10:10' },
    { name: 'services.php', isDir: false, size: '3.2K', date: '2026-04-01 10:10' }
  ],
  '/var/www/staycation/backend/sysadmin/core/debug/logs/explorer/database': [
    { name: '../', isDir: true },
    { name: 'migrations/', isDir: true, date: '2026-04-01 10:10' },
    { name: 'seeders/', isDir: true, date: '2026-04-01 10:10' },
    { name: 'database.sqlite', isDir: false, size: '4.5M', date: '2026-04-26 15:30' }
  ],
  '/var/www/staycation/backend/sysadmin/core/debug/logs/explorer/storage': [
    { name: '../', isDir: true },
    { name: 'app/', isDir: true, date: '2026-04-25 10:10' },
    { name: 'framework/', isDir: true, date: '2026-04-25 10:10' },
    { name: 'logs/', isDir: true, date: '2026-04-26 12:00' }
  ],
  '/var/www/staycation/backend/sysadmin/core/debug/logs/explorer/vendors': [
    { name: '../', isDir: true },
    { name: 'autoload.php', isDir: false, size: '1.1K', date: '2026-04-05 08:30' },
    { name: 'composer/', isDir: true, date: '2026-04-05 08:30' },
    { name: 'laravel/', isDir: true, date: '2026-04-05 08:30' },
    { name: 'symfony/', isDir: true, date: '2026-04-05 08:30' }
  ]
};

const MockExplorer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileParam = searchParams.get('file');
  const baseDir = '/var/www/staycation/backend/sysadmin/core/debug/logs/explorer';

  // State to track current "virtual" directory
  const [currentDir, setCurrentDir] = useState(baseDir);

  // Isolate styles by completely overriding the root level CSS
  useEffect(() => {
    const styleId = 'mock-explorer-isolation-styles';
    let styleEl = document.getElementById(styleId);
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `
        body { 
          background-color: white !important; 
          color: black !important; 
          font-family: monospace !important; 
          margin: 8px !important; 
          font-size: 14px !important;
          padding: 0 !important;
        }
        .mock-explorer-container {
          display: block !important;
          background-color: white;
          color: black;
          font-family: monospace;
          padding: 8px;
        }
        .mock-explorer-container table {
          width: 100%;
          text-align: left;
          border-collapse: collapse;
          font-family: monospace;
        }
        .mock-explorer-container th, .mock-explorer-container td {
          padding: 8px 4px;
          border-bottom: 1px solid #e5e7eb;
        }
        .mock-explorer-container th {
          border-top: 1px solid #e5e7eb;
          font-weight: bold;
        }
        .mock-explorer-container a {
          color: #0000ee !important;
          text-decoration: underline !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  // Compute the current virtual path based on the URL parameter
  useEffect(() => {
    if (!fileParam) {
      setCurrentDir(baseDir);
      return;
    }

    // Very simple path resolution simulation
    if (fileParam.endsWith('/')) {
        let newDir = baseDir;
        if (fileParam.startsWith('../')) {
            // Simulate traversal up
            newDir = baseDir; // Lock it at base for the demo, or go up if we had higher dirs
        } else {
           // Simulate going down
           const targetFolder = fileParam.replace(/\/$/, '');
           const potentialPath = `${baseDir}/${targetFolder}`;
           if (MOCK_FILE_SYSTEM[potentialPath]) {
               newDir = potentialPath;
           } else {
               newDir = baseDir; // Fallback
           }
        }
        setCurrentDir(newDir);
    }
  }, [fileParam, baseDir]);

  const handleNavigate = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Construct the super long, convoluted fake URL
    let targetFile = path;
    
    // If going up from a subdirectory
    if (path === '../' && currentDir !== baseDir) {
        navigate('?file=../'); // Takes back to base
        return;
    }
    
    // If traversing up from base
    if (path === '../' && currentDir === baseDir) {
        navigate('?file=../../../../.env&_ts=' + Date.now() + '&session_token=internal_auth_bypass_0x99283&render=raw');
        return;
    }

    // Normal navigation
    navigate(`?file=${targetFile}&_ts=${Date.now()}&mode=explore`);
  };

  // --- Render File Contents ---

  if (fileParam && (fileParam.includes('.env'))) {
    return (
      <div className="mock-explorer-container">
        <pre style={{ margin: '8px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
{`APP_NAME=Staycation
APP_ENV=production
APP_KEY=base64:7G3/fake+key+do+not+share/112233=
APP_DEBUG=false
APP_URL=https://staycation-prod.com

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=10.0.4.55
DB_PORT=3306
DB_DATABASE=staycation_prod_main
DB_USERNAME=admin_super_prod
DB_PASSWORD=P@ssw0rd_Prod_2026!_Secure123

# Firebase Service Account
FIREBASE_PROJECT_ID=staycation-production
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQ...fake_key...\\n-----END PRIVATE KEY-----\\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-prod@staycation-production.iam.gserviceaccount.com

# Payment Gateway (Stripe)
STRIPE_PUBLIC_KEY=pk_live_51H0fakekeyprod998877
STRIPE_SECRET_KEY=sk_live_51H0fakekeyprod112233

# SMTP / Email Configuration
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.staycation-prod.com
SMTP_PASSWORD=mg_fake_smtp_password_998877

# Cloud Storage (AWS S3)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=staycation-prod-assets`}
        </pre>
      </div>
    );
  }

  if (fileParam && fileParam.includes('.bak')) {
    return (
      <div className="mock-explorer-container">
        <pre style={{ margin: '8px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
{`[2026-04-01 04:22:01] production.INFO: Database backup initiated.
[2026-04-01 04:22:05] production.INFO: Dumping table: users
[2026-04-01 04:22:10] production.INFO: Dumping table: bookings
[2026-04-01 04:22:15] production.INFO: Backup completed successfully. Archive size: 52MB.`}
        </pre>
      </div>
    );
  }
  
  if (fileParam && (fileParam.includes('.php') || fileParam.includes('.py') || fileParam.includes('.sh'))) {
      return (
        <div className="mock-explorer-container">
          <pre style={{ margin: '8px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
{`<?php
// Restricted access warning
if (!defined('INTERNAL_DEBUG_MODE')) {
    die('Forbidden - Security Policy Violation Logged.');
}
// Script contents hidden
echo "Executing internal routine...";
?>`}
          </pre>
        </div>
      );
  }

  // --- Render Directory Listing ---
  
  const currentFiles = MOCK_FILE_SYSTEM[currentDir] || MOCK_FILE_SYSTEM[baseDir];

  return (
    <div className="mock-explorer-container">
      <h1 style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '16px', marginTop: '0' }}>
        Index of {currentDir}/?file=
      </h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Last modified</th>
            <th>Size</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {currentFiles.map((item: any, index: number) => (
            <tr key={index}>
              <td>
                <a 
                  href="#" 
                  onClick={(e) => handleNavigate(item.name, e)}
                >
                  {item.isDir ? `[DIR] ${item.name}` : item.name}
                </a>
              </td>
              <td>{item.date || '-'}</td>
              <td>{item.size || '-'}</td>
              <td>{item.isDir ? 'Directory' : 'File'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MockExplorer;
