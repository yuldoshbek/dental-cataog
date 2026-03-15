/**
 * ecosystem.config.js — PM2 конфигурация
 *
 * Запуск:           pm2 start ecosystem.config.js --env production
 * Статус:           pm2 status
 * Логи:             pm2 logs dental-api
 * Restart:          pm2 restart dental-api
 * Сохранить автозапуск: pm2 save && pm2 startup
 */

export default {
    apps: [
        {
            name: 'dental-api',
            script: 'node',
            args: '--experimental-sqlite index.js',
            cwd: '/var/www/dental-catalog/server',
            instances: 1,
            exec_mode: 'fork',
            watch: false,

            env: {
                NODE_ENV: 'development',
                PORT: 3001,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3001,
            },

            // Перезапуск при превышении памяти
            max_memory_restart: '300M',

            // Логирование — PM2 ротирует файлы при pm2 install pm2-logrotate
            out_file: '/var/log/dental-catalog/out.log',
            error_file: '/var/log/dental-catalog/error.log',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss',

            // Graceful restart: ждём process.send('ready') из server/index.js
            wait_ready: true,
            kill_timeout: 10000,
            listen_timeout: 15000,
        },
    ],
};
