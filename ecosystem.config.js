/**
 * ecosystem.config.js — PM2 конфигурация
 *
 * Запуск:  pm2 start ecosystem.config.js --env production
 * Статус:  pm2 status
 * Логи:    pm2 logs dental-api
 * Restart: pm2 restart dental-api
 * Сохранить автозапуск: pm2 save && pm2 startup
 */

export default {
    apps: [
        {
            name: 'dental-api',
            script: './server/index.js',
            cwd: '/var/www/dental-catalog',
            instances: 1,          // Увеличить до 'max' при высокой нагрузке
            exec_mode: 'fork',     // Изменить на 'cluster' при instances > 1
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

            // Логирование
            out_file: '/var/log/dental-catalog/out.log',
            error_file: '/var/log/dental-catalog/error.log',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss',

            // Graceful restart
            kill_timeout: 10000,
            wait_ready: true,
        },
    ],
};
