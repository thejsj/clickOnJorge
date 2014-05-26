from fabric.api import *
from fabric.colors import green, red
from fabric.contrib.project import rsync_project

from config import servers # A dictonary with all your enviornments

def set_environment(environment = False):
	if environment == False:
		print "You must specify and environment to push"
	else:
		env = servers[environment]
	return env

def deploy(environment = False): 
	"""This pushes to your environment""" 
	environment = set_environment(environment)
	__deploy__(environment)

def __deploy__(environment):
	env.host_string = environment.host_string
	env.user = environment.user
	env.password = environment.password
	with cd(environment.theme_path):
		run('pwd')
		run('git stash')
		run('git fetch --all')
		run('git reset --hard origin/master')
		run('service apache2 restart')
		run('npm install')
		run('grunt production')

def restart_mysql(environment = False): 
	"""This pushes to your environment""" 
	environment = set_environment(environment)
	__restart_mysql__(environment)

def __restart_mysql__(environment):
	"""Restart Mysql""" 
	env.host_string = environment.host_string
	env.user = environment.user
	env.password = environment.password
	with cd('/'):
		run('/etc/init.d/mysql restart')