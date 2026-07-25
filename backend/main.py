#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
AHMED-PC - تطبيق التحكم بـ Windows من الجوال
برنامج الخادم الرئيسي
"""

from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
import subprocess
import os
import platform
from datetime import datetime

# إنشاء تطبيق Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-me'
socketio = SocketIO(app, cors_allowed_origins="*")

# متغير لتخزين حالة الاتصال
connected_clients = []

# =====================
# Routes الأساسية
# =====================

@app.route('/')
def index():
    """الصفحة الرئيسية"""
    return jsonify({
        'status': 'success',
        'message': 'AHMED-PC - Windows Remote Control Server',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/status')
def get_status():
    """الحصول على حالة النظام"""
    return jsonify({
        'status': 'online',
        'platform': platform.system(),
        'connected_clients': len(connected_clients),
        'timestamp': datetime.now().isoformat()
    })

# =====================
# Socket.IO Events
# =====================

@socketio.on('connect')
def handle_connect():
    """عند اتصال جهاز جديد"""
    print(f'✅ جهاز جديد متصل: {request.sid}')
    connected_clients.append(request.sid)
    emit('connection_response', {
        'status': 'connected',
        'message': 'تم الاتصال بنجاح',
        'client_id': request.sid
    })

@socketio.on('disconnect')
def handle_disconnect():
    """عند قطع الاتصال"""
    print(f'❌ جهاز انقطع: {request.sid}')
    if request.sid in connected_clients:
        connected_clients.remove(request.sid)

@socketio.on('shutdown')
def handle_shutdown():
    """إيقاف الجهاز"""
    try:
        print('⏹️ أمر إيقاف الجهاز')
        if platform.system() == 'Windows':
            subprocess.run(['shutdown', '/s', '/t', '30'], check=True)
            emit('response', {
                'status': 'success',
                'message': 'سيتم إيقاف الجهاز بعد 30 ثانية'
            })
        else:
            emit('response', {
                'status': 'error',
                'message': 'هذا الأمر للـ Windows فقط'
            })
    except Exception as e:
        print(f'❌ خطأ: {str(e)}')
        emit('response', {
            'status': 'error',
            'message': f'خطأ: {str(e)}'
        })

@socketio.on('restart')
def handle_restart():
    """إعادة تشغيل الجهاز"""
    try:
        print('🔄 أمر إعادة تشغيل الجهاز')
        if platform.system() == 'Windows':
            subprocess.run(['shutdown', '/r', '/t', '30'], check=True)
            emit('response', {
                'status': 'success',
                'message': 'سيتم إعادة تشغيل الجهاز بعد 30 ثانية'
            })
        else:
            emit('response', {
                'status': 'error',
                'message': 'هذا الأمر للـ Windows فقط'
            })
    except Exception as e:
        print(f'❌ خطأ: {str(e)}')
        emit('response', {
            'status': 'error',
            'message': f'خطأ: {str(e)}'
        })

@socketio.on('open_app')
def handle_open_app(data):
    """فتح تطبيق"""
    try:
        app_path = data.get('path')
        print(f'📂 فتح التطبيق: {app_path}')
        if platform.system() == 'Windows':
            subprocess.Popen(app_path)
            emit('response', {
                'status': 'success',
                'message': f'تم فتح {app_path}'
            })
        else:
            emit('response', {
                'status': 'error',
                'message': 'هذا الأمر للـ Windows فقط'
            })
    except Exception as e:
        print(f'❌ خطأ: {str(e)}')
        emit('response', {
            'status': 'error',
            'message': f'خطأ: {str(e)}'
        })

@socketio.on('volume_control')
def handle_volume(data):
    """التحكم بالصوت"""
    try:
        action = data.get('action')  # 'up', 'down', 'mute'
        print(f'🔊 التحكم بالصوت: {action}')
        
        if platform.system() == 'Windows':
            if action == 'up':
                os.system('nircmd.exe changesysvolume 5000')
            elif action == 'down':
                os.system('nircmd.exe changesysvolume -5000')
            elif action == 'mute':
                os.system('nircmd.exe mutesysvolume 1')
            
            emit('response', {
                'status': 'success',
                'message': f'تم {action} الصوت'
            })
    except Exception as e:
        print(f'❌ خطأ: {str(e)}')
        emit('response', {
            'status': 'error',
            'message': f'خطأ: {str(e)}'
        })

@socketio.on('lock_screen')
def handle_lock_screen():
    """قفل الشاشة"""
    try:
        print('🔒 قفل الشاشة')
        if platform.system() == 'Windows':
            os.system('rundll32.exe user32.dll,LockWorkStation')
            emit('response', {
                'status': 'success',
                'message': 'تم قفل الشاشة'
            })
    except Exception as e:
        print(f'❌ خطأ: {str(e)}')
        emit('response', {
            'status': 'error',
            'message': f'خطأ: {str(e)}'
        })

# =====================
# معالجة الأخطاء
# =====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'الصفحة غير موجودة'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'خطأ داخلي في الخادم'
    }), 500

# =====================
# تشغيل التطبيق
# =====================

if __name__ == '__main__':
    print("""
    ╔════════════════════════════════════════╗
    ║   AHMED-PC - Remote Control Server    ║
    ║   Server is Running...                 ║
    ║   http://localhost:5000                ║
    ╚════════════════════════════════════════╝
    """)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
