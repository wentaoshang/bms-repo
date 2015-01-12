create table data(building varchar(40) not null,
                  room varchar(40) not null,
                  devtype varchar(40) not null,
                  devid varchar(40) not null,
                  datatype varchar(40) not null,
                  ts timestamp not null,
                  val double not null
);

create table symkey(building varchar(40) not null,
                    room varchar(40) not null,
                    devtype varchar(40) not null,
                    devid varchar(40) not null,
                    datatype varchar(40) not null,
                    ts timestamp not null,
                    val binary(32) not null
);