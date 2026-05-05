from setuptools import setup, find_packages

setup(
    name="production_floor",
    version="1.0.0",
    description="Simplified floor operator screens for NestERP",
    author="NestERP / Manifold SA",
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False
)
