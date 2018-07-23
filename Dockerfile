FROM /hueinfra/oracle-jdk:8u171
MAINTAINER YONEJI Iori <yoneji_i@worksap.co.jp>

RUN apt-get update -y && \
    apt-get install -y libgomp1 libelf1 libdw1 libpci3 libunwind8 python-pip && \
    apt-get clean

RUN pip install Flask

RUN echo "Etc/UTC" | tee /etc/timezone ; dpkg-reconfigure --frontend noninteractive tzdata

ADD src/scripting-server.py /usr/bin

WORKDIR /

# Assume /tmp
CMD [ "/scripting-server.py" ]

EXPOSE 8080
