#!/usr/bin/env python3
"""A simple Python example for testing"""

def greet(name):
    # Greet the user
    print(f"Hello, {name}!")
    return True

class Greeter:
    """A greeter class"""
    def __init__(self, name):
        self.name = name

    def say_hello(self):
        print(f"Hi, {self.name}!")

if __name__ == "__main__":
    greet("World")
    greeter = Greeter("Python")
    greeter.say_hello()
