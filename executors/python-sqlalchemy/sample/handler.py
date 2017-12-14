import logging

class ListHandler(logging.Handler):

    def __init__(self, target):
        logging.Handler.__init__(self)
        self.target = target

    def emit(self, record):
        self.target.append(record.msg) 
