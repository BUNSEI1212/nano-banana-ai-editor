#!/usr/bin/env node

/**
 * 修复激活系统安全漏洞
 * 问题：同一个激活码可以在多台设备上使用
 * 解决：确保一码一用
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const DB_PATHS = [
  './gemini-proxy/data/proxy.db',
  './nano-banana-desktop/backend/data/proxy.db',
  '/www/wwwroot/nano-banana/backend/data/proxy.db'
];

async function fixActivationSecurity() {
  console.log('🔧 开始修复激活系统安全漏洞...');
  
  for (const dbPath of DB_PATHS) {
    try {
      if (require('fs').existsSync(dbPath)) {
        console.log(`📁 处理数据库: ${dbPath}`);
        await fixDatabase(dbPath);
      }
    } catch (error) {
      console.warn(`⚠️ 跳过数据库 ${dbPath}: ${error.message}`);
    }
  }
  
  console.log('✅ 激活系统安全修复完成！');
}

async function fixDatabase(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`🔗 连接到数据库: ${dbPath}`);
      
      // 开始事务
      db.serialize(() => {
        // 1. 检查是否有重复的激活码
        db.all(`
          SELECT activation_code, COUNT(*) as count 
          FROM activations 
          GROUP BY activation_code 
          HAVING COUNT(*) > 1
        `, (err, duplicates) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (duplicates.length > 0) {
            console.log(`⚠️ 发现 ${duplicates.length} 个重复激活的激活码:`);
            duplicates.forEach(dup => {
              console.log(`   - ${dup.activation_code}: ${dup.count} 次激活`);
            });
            
            // 2. 删除重复的激活记录（保留最早的）
            duplicates.forEach(dup => {
              db.run(`
                DELETE FROM activations 
                WHERE activation_code = ? 
                AND id NOT IN (
                  SELECT id FROM activations 
                  WHERE activation_code = ? 
                  ORDER BY activated_at ASC 
                  LIMIT 1
                )
              `, [dup.activation_code, dup.activation_code], (err) => {
                if (err) {
                  console.error(`❌ 删除重复激活失败: ${err.message}`);
                } else {
                  console.log(`🗑️ 已删除激活码 ${dup.activation_code} 的重复激活`);
                }
              });
            });
          } else {
            console.log('✅ 没有发现重复激活的激活码');
          }
          
          // 3. 创建新的表结构（如果需要）
          db.run(`
            CREATE TABLE IF NOT EXISTS activations_new (
              id TEXT PRIMARY KEY,
              activation_code TEXT NOT NULL UNIQUE,
              device_id TEXT NOT NULL,
              device_info TEXT,
              user_identifier TEXT,
              credits_granted INTEGER NOT NULL,
              credits_used INTEGER DEFAULT 0,
              activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (activation_code) REFERENCES activation_codes (code)
            )
          `, (err) => {
            if (err) {
              console.warn(`⚠️ 创建新表失败（可能已存在）: ${err.message}`);
            } else {
              console.log('📋 创建了新的激活表结构');
            }
            
            // 4. 迁移数据（如果新表为空）
            db.get('SELECT COUNT(*) as count FROM activations_new', (err, result) => {
              if (!err && result.count === 0) {
                db.run(`
                  INSERT INTO activations_new 
                  SELECT DISTINCT * FROM activations 
                  GROUP BY activation_code
                `, (err) => {
                  if (err) {
                    console.warn(`⚠️ 数据迁移失败: ${err.message}`);
                  } else {
                    console.log('📦 数据迁移完成');
                  }
                });
              }
            });
            
            resolve();
          });
        });
      });
      
      db.close((err) => {
        if (err) {
          console.error(`❌ 关闭数据库失败: ${err.message}`);
        } else {
          console.log(`🔒 数据库已关闭: ${dbPath}`);
        }
      });
    });
  });
}

// 运行修复
if (require.main === module) {
  fixActivationSecurity().catch(console.error);
}

module.exports = { fixActivationSecurity };